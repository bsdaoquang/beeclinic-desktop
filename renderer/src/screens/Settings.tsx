/** @format */

import { Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	ClinicActivation,
	ClinicBackup,
	ClinicInfos,
	HTDTQG,
} from '../components';
import { clinicSelector } from '../store/reducers/clinic-reducer';
import type { ClinicModel } from '../types/ClinicModel';

const Settings = () => {
	const [activeTab, setActiveTab] = useState('clinic-infos');

	const location = useLocation();
	const navigate = useNavigate();
	const clinic: ClinicModel = useSelector(clinicSelector);

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
	const trialPeriodDaysLeft = clinic?.CreatedAt
		? Math.max(
				0,
				14 -
					Math.floor(
						(new Date().getTime() - new Date(clinic.CreatedAt).getTime()) /
							(1000 * 60 * 60 * 24)
					)
		  )
		: 0;

	const isActive = Boolean(clinic && clinic?.ActivationKey);
	const isTrial = Boolean(
		clinic && !clinic?.ActivationKey && trialPeriodDaysLeft > 0
	);

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
							disabled: !isActive && !isTrial,
						},
						{
							key: 'clinic-backup',
							label: 'Sao lưu & Phục hồi',
							children: <ClinicBackup />,
							disabled: !isActive && !isTrial,
						},
						{
							key: 'activation',
							label: 'Mã kích hoạt',
							children: <ClinicActivation />,
						},
						// {
						// 	key: 'security',
						// 	label: 'Bảo mật',
						// 	children: <SecurityScreen />,
						// 	disabled: !isActive && !isTrial,
						// },
					]}
				/>
			</div>
		</div>
	);
};

export default Settings;
