/** @format */

import { Affix, Button, Divider, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FooterComponent = () => {
	const [status, setStatus] = useState<
		'idle' | 'checking' | 'available' | 'downloading' | 'downloaded'
	>('idle');
	const [info, setInfo] = useState<any>(null);
	const [progress, setProgress] = useState<any>(null);
	const [version, setVersion] = useState('');

	useEffect(() => {
		getVersion();
		window.beeclinicAPI.onChecking(() => setStatus('checking'));
		window.beeclinicAPI.onAvailable((i) => {
			setInfo(i);
			setStatus('available');
		});
		window.beeclinicAPI.onProgress((p) => {
			setProgress(p);
			setStatus('downloading');
		});
		window.beeclinicAPI.onDownloaded((i) => {
			setInfo(i);
			setStatus('downloaded');
		});

		window.beeclinicAPI.check();
	}, []);

	// idle là ko có gì
	// checking là đang check
	// available là có bản mới
	// downloading là đang tải
	// downloaded là đã tải xong

	const getVersion = async () => {
		const response = await (window as any).beeclinicAPI.getVersion();
		setVersion(response.version);
	};

	const mySocialLinks = [
		{ name: 'youtube', url: 'https://www.youtube.com/@daoquang-livecode' },
		{ name: 'github', url: 'https://github.com/bsdaoquang' },
		{ name: 'facebook', url: 'https://www.facebook.com/bsdaoquang.dev' },
		{
			name: 'tiktok',
			url: 'https://www.tiktok.com/@hoclaptrinhlivecode',
		},
	];

	const renderUpdateStatus = () => {
		switch (status) {
			case 'idle':
				return null;
			case 'checking':
				return <Typography.Text>Đang kiểm tra cập nhật...</Typography.Text>;
			case 'available':
				return (
					<Space>
						<Typography.Text type='success'>
							Đã có bản cập nhật mới: {info?.version}
						</Typography.Text>
						<Button
							type='primary'
							size='small'
							onClick={async () => {
								await (window as any).beeclinicAPI.downloadUpdate(
									info?.version
								);
							}}>
							Tải về
						</Button>
					</Space>
				);
			case 'downloading':
				return (
					<Typography.Text type='secondary'>
						Đang tải bản cập nhật...{progress}%
					</Typography.Text>
				);
			case 'downloaded':
				return (
					<Button
						type='link'
						onClick={async () => {
							await (window as any).beeclinicAPI.installUpdate(info?.version);
						}}>
						Cập nhật ngay
					</Button>
				);
		}
	};

	return (
		<>
			<div
				style={{
					padding: 10,
					backgroundColor: '#f3f3f3',
					minHeight: 20,
				}}>
				<div className='row'>
					<div className='col-sm-12 col-md-8'>
						<Space>
							<Typography.Text>
								<Button
									type='link'
									size='small'
									onClick={async () => {
										await (window as any).beeclinicAPI.openExternal(
											'https://yhocso-ejs-2.vercel.app/'
										);
									}}>
									Y Học Số Co., Ltd.
								</Button>{' '}
								© 2025
							</Typography.Text>
							<Divider type='vertical' />
							<Typography.Text type='secondary'>Liên hệ: </Typography.Text>
							<Link to='tel:+84328323686' className='text-muted'>
								<Typography.Text className='text-muted'>
									+84 032 832 3686
								</Typography.Text>
							</Link>
							<Divider type='vertical' />
							<Space size={24}>
								{/* <Link to='mailto:bsdaoquang@gmail.com' className='text-muted'>
									<i
										className='fas fa-envelope text-muted'
										style={{ fontSize: 14 }}
									/>
								</Link> */}
								{mySocialLinks.map((link) => (
									<Button
										key={link.name}
										type='text'
										onClick={async () =>
											await (window as any).beeclinicAPI.openExternal(link.url)
										}
										icon={<i className={`fab fa-${link.name} text-muted`} />}
									/>
								))}
							</Space>
						</Space>
					</div>
					<div className='col-sm-12 col-md-4 text-end'>
						<Space size='large'>
							{renderUpdateStatus()}
							<Typography.Text>
								<i>Phiên bản: {version}</i> - <a href=''>All rights reserved</a>
							</Typography.Text>
						</Space>
					</div>
				</div>
			</div>
		</>
	);
};

export default FooterComponent;
