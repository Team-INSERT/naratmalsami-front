export function getCookie(name: string): string | null {
	const raw = document.cookie
		.split('; ')
		.find((row) => row.startsWith(`${name}=`))
		?.split('=')[1];
	return raw ? decodeURIComponent(raw) : null;
}
