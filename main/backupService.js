/** @format */

// main/backupService.js
import fs from 'fs';
const fsp = fs.promises;
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import archiver from 'archiver';
import { google } from 'googleapis';
import { lookup as mimeLookup } from 'mime-types';

// Utility: nén thành .zip ở file tạm
const zipPathsToFile = async (paths, outZipPath) => {
	await fsp.mkdir(path.dirname(outZipPath), { recursive: true });
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(outZipPath);
		const archive = archiver('zip', { zlib: { level: 9 } });

		output.on('close', () => resolve(outZipPath));
		archive.on('error', reject);

		archive.pipe(output);
		for (const p of paths) {
			const stat = fs.statSync(p);
			if (stat.isDirectory()) {
				archive.directory(p, path.basename(p));
			} else {
				archive.file(p, { name: path.basename(p) });
			}
		}
		archive.finalize();
	});
};

// AES-256-GCM mã hoá file zip → .enc
const encryptFileAesGcm = async (inPath, outPath, passphrase) => {
	await fsp.mkdir(path.dirname(outPath), { recursive: true });
	const salt = crypto.randomBytes(16);
	const iv = crypto.randomBytes(12);
	// derive key
	const key = crypto.scryptSync(passphrase, salt, 32);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

	return new Promise((resolve, reject) => {
		const input = fs.createReadStream(inPath);
		const output = fs.createWriteStream(outPath);
		output.write(Buffer.from('BCBK')); // magic header BeeClinic BacKup
		output.write(salt);
		output.write(iv);

		input.on('error', reject);
		output.on('error', reject);

		input.pipe(cipher).pipe(output);

		input.on('end', () => {
			const tag = cipher.getAuthTag();
			output.write(tag);
			output.end();
		});
		output.on('close', () => resolve(outPath));
	});
};

// Giải mã ngược
const decryptFileAesGcm = async (inPath, outPath, passphrase) => {
	const fd = fs.openSync(inPath, 'r');
	const header = Buffer.alloc(4);
	fs.readSync(fd, header, 0, 4, 0);
	if (header.toString() !== 'BCBK')
		throw new Error('Invalid backup file header');

	const salt = Buffer.alloc(16);
	fs.readSync(fd, salt, 0, 16, 4);
	const iv = Buffer.alloc(12);
	fs.readSync(fd, iv, 0, 12, 20);

	const stats = fs.statSync(inPath);
	const tag = Buffer.alloc(16);
	fs.readSync(fd, tag, 0, 16, stats.size - 16);
	const dataStart = 36; // 4 + 16 + 12
	const dataLen = stats.size - dataStart - 16;

	const key = crypto.scryptSync(passphrase, salt, 32);
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(tag);

	await fsp.mkdir(path.dirname(outPath), { recursive: true });

	return new Promise((resolve, reject) => {
		const input = fs.createReadStream(inPath, {
			start: dataStart,
			end: dataStart + dataLen - 1,
		});
		const output = fs.createWriteStream(outPath);
		input.on('error', reject);
		output.on('error', reject);
		input.pipe(decipher).pipe(output);
		output.on('close', () => resolve(outPath));
	});
};

const uploadToDrive = async (oAuth2Client, localPath, opts = {}) => {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });
	const folderName = opts.folderName || 'BeeClinic Backup';
	// Tìm/tạo folder
	const q = `name='${folderName.replace(
		/'/g,
		"\\'"
	)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
	const { data: search } = await drive.files.list({
		q,
		fields: 'files(id,name)',
	});
	let folderId = search.files?.[0]?.id;
	if (!folderId) {
		const { data } = await drive.files.create({
			resource: {
				name: folderName,
				mimeType: 'application/vnd.google-apps.folder',
			},
			fields: 'id',
		});
		folderId = data.id;
	}

	const fileName = path.basename(localPath);
	const mimeType = mimeLookup(fileName) || 'application/octet-stream';
	const media = { mimeType, body: fs.createReadStream(localPath) };

	const { data: uploaded } = await drive.files.create({
		resource: { name: fileName, parents: [folderId] },
		media,
		fields: 'id,name,createdTime,size',
	});

	return {
		id: uploaded.id,
		name: uploaded.name,
		createdTime: uploaded.createdTime,
		size: uploaded.size,
		folderId,
	};
};

const listBackups = async (oAuth2Client, folderName = 'BeeClinic Backup') => {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });
	const { data: folder } = await drive.files.list({
		q: `name='${folderName.replace(
			/'/g,
			"\\'"
		)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
		fields: 'files(id,name)',
	});
	if (!folder.files?.[0]) return [];
	const folderId = folder.files[0].id;
	const { data } = await drive.files.list({
		q: `'${folderId}' in parents and trashed=false`,
		orderBy: 'createdTime desc',
		fields: 'files(id,name,createdTime,size)',
		pageSize: 100,
	});
	return data.files || [];
};

const deleteBackup = async (oAuth2Client, fileId) => {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });
	await drive.files.delete({ fileId });
	return { ok: true };
};

const deleteOldBackups = async (
	oAuth2Client,
	keep = 7,
	folderName = 'BeeClinic Backup'
) => {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });
	const files = await listBackups(oAuth2Client, folderName);
	const toDelete = files.slice(keep);
	for (const f of toDelete) {
		await drive.files.delete({ fileId: f.id });
	}
	return { deleted: toDelete.length };
};

/**
 * Thực hiện full backup:
 *  - paths: mảng đường dẫn cần backup (VD: db.sqlite, folderUploads)
 *  - passphrase: chuỗi người dùng nhập
 *  - keep: số bản muốn giữ lại
 */
const runFullBackup = async (oAuth2Client, { paths, passphrase, keep = 7 }) => {
	const ts = new Date();
	const stamp = ts
		.toISOString()
		.replace(/[:.]/g, '')
		.replace('T', '-')
		.slice(0, 15);
	const tmpDir = path.join(os.tmpdir(), 'beeclinic-bak');
	const zipPath = path.join(tmpDir, `beeclinic-${stamp}.zip`);
	const encPath = `${zipPath}.enc`;

	await zipPathsToFile(paths, zipPath);
	await encryptFileAesGcm(zipPath, encPath, passphrase);
	const uploaded = await uploadToDrive(oAuth2Client, encPath);
	await deleteOldBackups(oAuth2Client, keep);
	// cleanup
	try {
		await fsp.unlink(zipPath);
	} catch {}
	try {
		await fsp.unlink(encPath);
	} catch {}

	return uploaded;
};

/**
 * Khôi phục:
 *  - download fileId về temp
 *  - decrypt ra zip
 *  - giải nén zip vào đích (dừng app/đóng DB trước khi ghi đè)
 */
const restoreFromDrive = async (
	oAuth2Client,
	{ fileId, passphrase, extractToDir }
) => {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });
	const tmpDir = path.join(os.tmpdir(), 'beeclinic-restore');
	await fsp.mkdir(tmpDir, { recursive: true });
	const encPath = path.join(tmpDir, `restore.enc`);
	const zipPath = path.join(tmpDir, `restore.zip`);

	const dest = fs.createWriteStream(encPath);
	await new Promise((resolve, reject) => {
		drive.files.get(
			{ fileId, alt: 'media' },
			{ responseType: 'stream' },
			(err, res) => {
				if (err) return reject(err);
				res.data.on('error', reject).pipe(dest).on('finish', resolve);
			}
		);
	});

	await decryptFileAesGcm(encPath, zipPath, passphrase);

	// extract zip
	await new Promise((resolve, reject) => {
		const unzip = require('unzipper');
		fs.createReadStream(zipPath)
			.pipe(unzip.Extract({ path: extractToDir }))
			.on('error', reject)
			.on('close', resolve);
	});

	return { ok: true };
};

export { runFullBackup, listBackups, restoreFromDrive, deleteBackup };
