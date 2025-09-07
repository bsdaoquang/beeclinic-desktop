/** @format */

import { Tabs } from 'antd';
import {
	ClinicActivation,
	ClinicBackup,
	ClinicInfos,
	HTDTQG,
} from '../components';
import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Settings = () => {
	const [activeTab, setActiveTab] = useState('clinic-infos');

	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const tabKey = params.get('tabKey');
		if (tabKey) {
			setActiveTab(tabKey);
		}
	}, [location.search]);

	const handleTabChange = (key: string) => {
		setActiveTab(key);
		const params = new URLSearchParams(location.search);
		params.set('tabKey', key);
		navigate({ search: params.toString() }, { replace: true });
	};

	return (
		<div className='container-fluid'>
			<div className='container py-5'>
				<Tabs
					activeKey={activeTab}
					onChange={handleTabChange}
					defaultActiveKey='clinic-infos'
					className='settings-tabs'
					tabPosition='left'
					size='small'
					items={[
						{
							key: 'clinic-infos',
							label: 'Thông tin',
							children: <ClinicInfos />,
						},
						{
							key: 'clinic-appearance',
							label: 'Đơn thuốc Quốc Gia',
							children: <HTDTQG />,
						},
						{
							key: 'clinic-backup',
							label: 'Sao lưu & Phục hồi',
							children: <ClinicBackup />,
						},
						{
							key: 'activation',
							label: 'Mã kích hoạt',
							children: <ClinicActivation />,
						},
					]}
				/>
			</div>
		</div>
	);
};

export default Settings;
