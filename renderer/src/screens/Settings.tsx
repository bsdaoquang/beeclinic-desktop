/** @format */

import { Tabs } from 'antd';
import { ClinicInfos } from '../components';

const Settings = () => {
	return (
		<div className='container-fluid'>
			<div className='container py-5'>
				<Tabs
					defaultActiveKey='clinic-infos'
					className='settings-tabs'
					tabPosition='left'
					items={[
						{
							key: 'clinic-infos',
							label: 'Thông tin',
							children: <ClinicInfos />,
						},
					]}
				/>
			</div>
		</div>
	);
};

export default Settings;
