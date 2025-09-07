/** @format */

import { ConfigProvider, message } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import dayjs, { locale } from 'dayjs';
import 'dayjs/locale/vi';
import { Provider } from 'react-redux';
import '../src/styles/index.css';
import Routers from './routers/Routers';
import store from './store/store';
import { theme } from './styles/theme';

dayjs.locale('vi');
message.config({});

function App() {
	ChartJS.register(
		CategoryScale,
		LinearScale,
		BarElement,
		LinearScale,
		PointElement,
		LineElement,
		Title,
		Tooltip,
		Legend
	);

	return (
		<ConfigProvider theme={theme} locale={locale as any}>
			<Provider store={store}>
				<Routers />
			</Provider>
		</ConfigProvider>
	);
}

export default App;
