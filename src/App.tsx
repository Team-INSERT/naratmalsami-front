import { createBrowserRouter, RouterProvider, LoaderFunction, useRouteError } from 'react-router-dom';
import FilePage from '@/pages/file';
import IndexPage from '@/pages/index/ui';
import WritePage from '@/pages/write/ui';
import SetGreetingPage from '@/pages/debug';

const greetingAuthLoader: LoaderFunction = () => {
	const hasGreeting = document.cookie.split('; ').some((c) => c === 'greeting=' + encodeURIComponent('Hq6JiiHb0U6JbWSzJtzWik'));
	if (!hasGreeting) {
		throw new Response('Forbidden', { status: 403 });
	}
	return null;
};

function ForbiddenPage() {
	const err = useRouteError() as Response;
	if (err.status === 403) {
		return (
			<div style={{ padding: 32, textAlign: 'center' }}>
				<h1>403 Forbidden</h1>
			</div>
		);
	}
	throw err;
}

const router = createBrowserRouter([
	{ path: '/debug/:value', element: <SetGreetingPage /> },

	{
		path: '/',
		loader: greetingAuthLoader,
		errorElement: <ForbiddenPage />,
		children: [
			{ index: true, element: <IndexPage /> },
			{ path: 'file', element: <FilePage /> },
			{ path: 'write/:hashed_id', element: <WritePage /> },
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
