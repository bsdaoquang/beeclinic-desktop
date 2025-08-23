/** @format */

import { Card, DatePicker, Empty, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { chartOptions } from '../styles/chartOptions';
import type { PrescriptionModel } from '../types/PrescriptionModel';

dayjs.extend(isSameOrBefore);

const Reports = () => {
	const [times, setTimes] = useState<{
		start: string | null;
		end: string | null;
	}>({
		start: null,
		end: null,
	});
	const [dateKey, setDateKey] = useState('this_month');
	const [prescriptions, setPrescriptions] = useState<PrescriptionModel[]>([]);
	const [chartDatas, setChartDatas] = useState<{
		labels: string[];
		datasets: any[];
	}>({
		labels: [],
		datasets: [],
	});

	const dateSelectOptions = [
		{
			label: 'Hôm nay',
			value: 'today',
		},
		{
			label: 'Tuần này',
			value: 'this_week',
		},
		{
			label: 'Tuần trước',
			value: 'last_week',
		},
		{
			label: 'Tháng này',
			value: 'this_month',
		},
		{
			label: 'Tháng trước',
			value: 'last_month',
		},
		{
			label: 'Năm nay',
			value: 'this_year',
		},

		{
			label: 'Năm trước',
			value: 'last_year',
		},
	];

	useEffect(() => {
		const now = new Date();
		switch (dateKey) {
			case 'today': {
				const start = new Date(now.setHours(0, 0, 0, 0));
				const end = new Date(now.setHours(23, 59, 59, 999));
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'this_week': {
				const curr = new Date();
				const first = curr.getDate() - curr.getDay();
				const start = new Date(curr.setDate(first));
				start.setHours(0, 0, 0, 0);
				const end = new Date(curr.setDate(first + 6));
				end.setHours(23, 59, 59, 999);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'last_week': {
				const curr = new Date();
				const first = curr.getDate() - curr.getDay() - 7;
				const start = new Date(curr.setDate(first));
				start.setHours(0, 0, 0, 0);
				const end = new Date(curr.setDate(first + 6));
				end.setHours(23, 59, 59, 999);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'this_month': {
				const curr = new Date();
				const start = new Date(
					curr.getFullYear(),
					curr.getMonth(),
					1,
					0,
					0,
					0,
					0
				);
				const end = new Date(
					curr.getFullYear(),
					curr.getMonth() + 1,
					0,
					23,
					59,
					59,
					999
				);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'last_month': {
				const curr = new Date();
				const start = new Date(
					curr.getFullYear(),
					curr.getMonth() - 1,
					1,
					0,
					0,
					0,
					0
				);
				const end = new Date(
					curr.getFullYear(),
					curr.getMonth(),
					0,
					23,
					59,
					59,
					999
				);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'this_year': {
				const curr = new Date();
				const start = new Date(curr.getFullYear(), 0, 1, 0, 0, 0, 0);
				const end = new Date(curr.getFullYear(), 11, 31, 23, 59, 59, 999);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			case 'last_year': {
				const curr = new Date();
				const start = new Date(curr.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
				const end = new Date(curr.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
				setTimes({
					start: start.toISOString(),
					end: end.toISOString(),
				});
				break;
			}
			default:
				break;
		}
	}, [dateKey]);

	useEffect(() => {
		getAllPrescriptions();
	}, []);

	useEffect(() => {
		if (prescriptions.length === 0 || !times.start || !times.end) {
			return;
		}

		const startDate = dayjs(times.start);
		const endDate = dayjs(times.end);
		const labels: string[] = [];

		let current = startDate.clone();

		const total: number[] = [];
		const totalMedicines: number[] = [];
		const totalServices: number[] = [];

		while (current.isSameOrBefore(endDate, 'day')) {
			labels.push(current.format('DD/MM'));
			// console.log(current.format('DD/MM/YYYY'));

			const prescriptionsInDay = prescriptions.filter((p) => {
				const createdAt = dayjs(p.created_at);
				return createdAt.isSame(current, 'day');
			});

			const totalInDay = prescriptionsInDay.reduce(
				(sum, p) => sum + (p.total ?? 0),
				0
			);

			total.push(totalInDay);

			const totalMedicinesInDay = prescriptionsInDay.reduce(
				(sum, p) =>
					sum +
					(JSON.parse(p.thong_tin_don_thuoc_json).reduce(
						(a: number, b: any) => a + (b.gia_ban ?? 0),
						0
					) ?? 0),
				0
			);

			const totalServicesInDay = prescriptionsInDay.reduce(
				(sum, p) =>
					sum +
					(JSON.parse(p.thong_tin_dich_vu_json).reduce(
						(a: number, b: any) => a + (b.gia ?? 0),
						0
					) ?? 0),
				0
			);

			totalMedicines.push(totalMedicinesInDay);
			totalServices.push(totalServicesInDay);
			current = current.add(1, 'day');
		}

		setChartDatas((prev) => ({
			...prev,
			labels,
			datasets: [
				{
					label: 'Tổng doanh thu',
					data: total,
					backgroundColor: 'rgba(24, 144, 255, 0.6)',
					borderColor: 'rgba(24, 144, 255, 1)',
					borderWidth: 2,
					tension: 0.1,
				},
				{
					label: 'Thuốc',
					data: totalMedicines,
					backgroundColor: 'rgba(255, 100, 100, 0.6)',
					borderColor: 'rgba(255, 100, 100, 1)',
					borderWidth: 2,
					tension: 0.1,
					pointRadius: 5,
				},
				{
					label: 'Dịch vụ - Thủ thuật',
					data: totalServices,
					backgroundColor: 'rgba(100, 255, 100, 0.6)',
					borderColor: 'rgba(100, 255, 100, 1)',
					borderWidth: 2,
					tension: 0.1,
				},
			],
		}));
	}, [times, prescriptions]);

	const getAllPrescriptions = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getPrescriptions();
			setPrescriptions(res);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className='container-fluid py-4'>
			<div className='container'>
				<div className='row'>
					<div className='col'>
						<Typography.Title type='secondary' level={2}>
							Báo cáo
						</Typography.Title>
					</div>
					<div className='col text-end'>
						<Space>
							<Select
								onChange={(val) => setDateKey(val)}
								style={{
									minWidth: 120,
								}}
								value={dateKey}
								variant='filled'
								allowClear
								options={dateSelectOptions}
							/>
							<DatePicker.RangePicker
								format={'DD/MM/YYYY'}
								variant='filled'
								value={[dayjs(times.start), dayjs(times.end)]}
								onChange={(values) => {
									values &&
										values.length > 0 &&
										setTimes({
											start: values[0] ? values[0].toISOString() : null,
											end: values[1] ? values[1].toISOString() : null,
										});
								}}
							/>
						</Space>
					</div>
				</div>
				<div className='mt-4'>
					{prescriptions.length > 0 ? (
						<Card size='small' variant='borderless'>
							<Line
								options={{
									...chartOptions,
								}}
								data={chartDatas}
							/>
						</Card>
					) : (
						<Empty description='Không có dữ liệu' />
					)}
				</div>
			</div>
		</div>
	);
};

export default Reports;
