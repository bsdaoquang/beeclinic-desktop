/** @format */

import { Affix, Typography } from 'antd';

const FooterComponent = () => {
	return (
		<Affix offsetBottom={0}>
			<div
				style={{
					padding: '10px',
					backgroundColor: '#f3f3f3',
					minHeight: 20,
				}}>
				<div className='row'>
					<div className='col'>
						<Typography.Text>
							<a href='https://yhocso.com'>Y Học Số</a> © 2025
						</Typography.Text>
					</div>
					<div className='col text-end'>
						<Typography.Text>
							Ver 1.0.0 - <a href=''>All rights reserved</a>
						</Typography.Text>
					</div>
				</div>
				{/* <Row>
					<Col span={12} style={{ textAlign: 'left' }}>
						<Typography.Paragraph style={{ margin: 0 }}>
							<a href='https://yhocso.com'>Y Học Số</a> © 2025
						</Typography.Paragraph>
					</Col>
					<Col span={12} style={{ textAlign: 'right' }}>
						<Typography.Paragraph style={{ margin: 0 }}>
							Ver 1.0.0 - <a href=''>All rights reserved</a>
						</Typography.Paragraph>
					</Col>
				</Row> */}
			</div>
		</Affix>
		// <div
		// 	style={{
		// 		padding: '10px',
		// 		backgroundColor: '#e0e0e0',
		// 		height: 20,
		// 	}}>
		// 	<Typography.Paragraph>
		// 		FooterComponent - © 2023 Your Company Name
		// 	</Typography.Paragraph>
		// </div>
	);
};

export default FooterComponent;
