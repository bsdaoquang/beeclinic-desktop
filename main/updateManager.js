/** @format */

// main/updateManager.js

import { app } from 'electron';
import semver from 'semver';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
const createUpdateManager = ({
	win, // BrowserWindow
	onAskBackupAndUpdate, // fn async() => throw để huỷ nếu backup fail
	channel = 'latest', // hoặc 'beta'
}) => {
	autoUpdater.checkForUpdatesAndNotify({ isForceDevUpdateConfig: true });
	autoUpdater.autoDownload = false; // chỉ tải khi user đồng ý
	autoUpdater.autoInstallOnAppQuit = false; // tự quyết định lúc nào cài
	autoUpdater.allowDowngrade = false;
	autoUpdater.fullChangelog = true;
	autoUpdater.channel = channel; // match with your publisher channel

	// Truyền log sang renderer
	const send = (event, payload = {}) => {
		win?.webContents.send(`updater:${event}`, payload);
	};

	// ===== Listeners của autoUpdater =====
	autoUpdater.on('checking-for-update', () => send('checking'));
	autoUpdater.on('update-available', (info) => send('available', info));
	autoUpdater.on('update-not-available', (info) => send('not-available', info));
	autoUpdater.on('error', (err) =>
		send('error', { message: err?.message || String(err) })
	);
	autoUpdater.on('download-progress', (p) => send('progress', p));
	autoUpdater.on('update-downloaded', (info) => send('downloaded', info));

	// ===== API public (gọi từ IPC) =====
	const check = async () => {
		try {
			const result = await autoUpdater.checkForUpdates();
			// Có thể tự so sánh nếu bạn muốn chặn các bản thấp hơn
			if (
				result?.updateInfo?.version &&
				semver.lt(result.updateInfo.version, app.getVersion())
			) {
				send('not-available', { reason: 'lower-than-installed' });
			}
			return { ok: true, info: result?.updateInfo || null };
		} catch (e) {
			send('error', { message: e?.message || String(e) });
			return { ok: false, error: e?.message || String(e) };
		}
	};

	const download = async () => {
		// Gọi backup trước khi tải/cài
		if (onAskBackupAndUpdate) {
			await onAskBackupAndUpdate('before-download'); // throw nếu huỷ
		}
		await autoUpdater.downloadUpdate();
		return { ok: true };
	};

	const installNow = async () => {
		if (onAskBackupAndUpdate) {
			await onAskBackupAndUpdate('before-install'); // optional backup lần 2
		}
		// Thoát & cài ngay
		setImmediate(() => {
			autoUpdater.quitAndInstall(false, true);
		});
		return { ok: true };
	};

	return { check, download, installNow };
};

export { createUpdateManager };
