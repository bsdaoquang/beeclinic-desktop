/** @format */

import { Button, Input, Modal, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BsEye, BsEyeSlash, BsFillShieldLockFill } from 'react-icons/bs';
import bcrypt from 'bcryptjs-react';
import type { ClinicModel } from '../types/ClinicModel';
import { useSelector } from 'react-redux';
import { clinicSelector } from '../store/reducers/clinic-reducer';

interface LockScreenModalProps {
	visible: boolean;
	onClose: () => void;
}

const LockScreenModal = ({
	visible = false,
	onClose,
}: LockScreenModalProps) => {
	const [pass, setPass] = useState('');
	const [isShowPass, setIsShowPass] = useState(false);
	const [errorTest, setErrorTest] = useState('');

	const passRef = useRef<any>(null);
	const clinic: ClinicModel = useSelector(clinicSelector);
	const hashedPassword = clinic?.lockscreen_password || '';

	useEffect(() => {
		if (!visible) {
			setPass('');
			setIsShowPass(false);
		}
	}, [visible]);

	useEffect(() => {
		if (pass.length === 6) {
			handleUnlock();
		}
	}, [pass]);

	const handleUnlock = async () => {
		if (!hashedPassword) {
			setErrorTest('Không tìm thấy mật khẩu khoá màn hình.');
			return;
		}
		const isMatch = await bcrypt.compare(pass, hashedPassword);
		if (isMatch) {
			setErrorTest('');
			onClose();
			setPass('');
		} else {
			setErrorTest('Mật khẩu không đúng. Vui lòng thử lại.');
			setPass('');
			passRef.current?.focus?.();
		}
	};

	return (
		<Modal
			closable={false}
			maskClosable={false}
			open={visible}
			footer={null}
			centered
			style={{ minHeight: 300 }}>
			<div className='text-center py-4'>
				<div className='mt-4 mb-3'>
					<div
						style={{
							padding: 20,
							borderRadius: '50%',
							backgroundColor: '#f0f0f0',
							display: 'inline-block',
						}}>
						<BsFillShieldLockFill size={64} color='#9a9a9aff' />
					</div>
				</div>
				<div className='mb-4'>
					<Typography.Paragraph type='secondary' className='mb-1'>
						<strong>Khoá màn hình</strong>
					</Typography.Paragraph>
					<Typography.Paragraph type='secondary'>
						Dữ liệu của Bạn đang được bảo vệ. Nhập mật khẩu của bạn để mở khoá
						màn hình
					</Typography.Paragraph>
				</div>
				<div className='mb-3'>
					<Input.OTP
						status={errorTest ? 'error' : undefined}
						ref={passRef}
						value={pass}
						variant='filled'
						size='large'
						autoFocus
						mask={isShowPass ? undefined : '🔒'}
						length={6}
						onChange={(value) => setPass(value)}
						security='true'
						inputMode='numeric'
					/>
				</div>
				<Button
					type='link'
					size='small'
					icon={isShowPass ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
					onClick={() => setIsShowPass(!isShowPass)}>
					{isShowPass ? 'Hide' : 'Show'} Password
				</Button>

				{errorTest && (
					<Typography.Text type='danger' className='d-block mt-3'>
						{errorTest}
					</Typography.Text>
				)}
			</div>
		</Modal>
	);
};

export default LockScreenModal;
