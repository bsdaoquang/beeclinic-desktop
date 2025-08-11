/** @format */

import { Button, Input, Typography } from 'antd';
import { BiSearchAlt2 } from 'react-icons/bi';

const Home = () => {
	return (
		<div>
			<div className='container-fluid'>
				<div className='container'>
					<div className='row mt-5'>
						<div className='col-8 offset-2'>
							<div className='mb-5'>
								<Typography.Title level={1} type='secondary' className='mb-0'>
									Bee Clinic
								</Typography.Title>
								<Typography.Paragraph
									type='secondary'
									style={{
										fontSize: 18,
									}}>
									Phần mềm quản lý phòng khám
								</Typography.Paragraph>
							</div>
							<div className='my-3'>
								<Input.Search
									enterButton='Tìm kiếm'
									variant='filled'
									prefix={<BiSearchAlt2 size={20} className='text-muted' />}
									size='large'
									allowClear
									placeholder='Tìm kiếm theo tên, số điện thoại hoặc CCCD...'
								/>
							</div>
							<div className='text-center mt-4'>
								<Button type='default' className='px-5' size='large'>
									Thêm bệnh nhân
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
