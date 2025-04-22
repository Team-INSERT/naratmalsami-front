import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function SetGreetingPage() {
	const { value } = useParams<{ value: string }>();
	const navigate = useNavigate();

	useEffect(() => {
		const greeting = value ? decodeURIComponent(value) : '안녕하세요';

		document.cookie = `greeting=${encodeURIComponent(greeting)};` + `path=/; max-age=${60 * 60 * 24 * 1}; SameSite=Lax`;

		navigate('/write/7J206rG47LC+64SkPw==', { replace: true });
	}, [value, navigate]);

	return <p>이동중…</p>;
}
