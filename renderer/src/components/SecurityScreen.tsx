/** @format */

import { Switch, Typography } from 'antd';
import type { ClinicModel } from '../types/ClinicModel';
import { useSelector } from 'react-redux';
import { clinicSelector } from '../store/reducers/clinic-reducer';
import { useState } from 'react';

const SecurityScreen = () => {
	const clinic: ClinicModel = useSelector(clinicSelector);

	const [isSecurity, setIsSecurity] = useState(
		clinic.lockscreen_password ? true : false
	);

	return (
		<div className='container'>
			<Typography.Title className='mb-1' level={4}>
				Bảo mật
			</Typography.Title>
			<Typography.Text>
				{`Tính năng Khoá màn hình giúp bảo vệ dữ liệu phòng khám khi bạn rời máy
				tính. `}
			</Typography.Text>
			<Typography.Paragraph>
				Khi bật, BeeClinic sẽ yêu cầu nhập mật khẩu mỗi lần mở ứng dụng và sẽ tự
				động khoá sau một khoảng thời gian không sử dụng.
			</Typography.Paragraph>
			<div className='mt-3'>
				<Switch disabled checked={isSecurity} onChange={setIsSecurity} />{' '}
				<Typography.Text className='ms-2'>
					Bật tính năng khoá màn hình
				</Typography.Text>
			</div>
		</div>
	);
};

export default SecurityScreen;
