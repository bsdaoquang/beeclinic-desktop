/** @format */

import { Button, Form, Input } from 'antd';
import axios from 'axios';

interface LoginCSKCBProps {
	onOK: (token: string) => void;
	onError: (error: string) => void;
}

const LoginCSKCB = ({ onOK, onError }: LoginCSKCBProps) => {
	const [form] = Form.useForm();

	const handleLogin = async (values: {
		cskcbCode: string;
		password: string;
	}) => {
		try {
			const res: any = await axios({
				method: 'post',
				data: {
					ma_lien_thong_co_so_kham_chua_benh: values.cskcbCode,
					mat_khau: values.password,
				},
				url: 'https://api.donthuocquocgia.vn/api/auth/dang-nhap-co-so-kham-chua-benh',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (res && res.data && res.status === 200) {
				// update clinic to database
				onOK(res.data.token ?? '');
			}
		} catch (error: any) {
			console.log(error);
			onError(error.response.data[0] as string);
		}
	};

	return (
		<div>
			<div className='mt-5'>
				<div className='row'>
					<div className='col-md-6 offset-md-3'>
						<Form
							form={form}
							onFinish={handleLogin}
							layout='vertical'
							size='large'
							variant='filled'>
							<Form.Item
								name='cskcbCode'
								rules={[
									{
										required: true,
										message: 'Mã liên thông CSKCB không được để trống',
									},
								]}
								label='Mã liên thông CSKCB'>
								<Input
									allowClear
									placeholder='Nhập mã liên thông CSKCB do HTĐTQG cấp'
								/>
							</Form.Item>
							<Form.Item
								name='password'
								label='Mật khẩu'
								rules={[
									{
										required: true,
										message: 'Mật khẩu không được để trống',
									},
								]}>
								<Input.Password allowClear />
							</Form.Item>
							<Form.Item>
								<Button
									className='mt-3'
									onClick={() => form.submit()}
									block
									type='primary'
									htmlType='submit'>
									Đăng nhập
								</Button>
							</Form.Item>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginCSKCB;
