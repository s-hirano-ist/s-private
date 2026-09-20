const GIGAZINE_HEADLINE_URL =
	/^https:\/\/gigazine\.net\/news\/\d{8}-headline$/u;

self.addEventListener("push", (event) => {
	if (!event.data) return;
	const payload = event.data.json();
	if (!GIGAZINE_HEADLINE_URL.test(payload.url)) return;
	event.waitUntil(
		self.registration.showNotification(payload.title, {
			body: payload.body,
			data: { url: payload.url },
			icon: payload.icon,
			tag: payload.tag,
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = event.notification.data?.url;
	if (typeof url !== "string" || !GIGAZINE_HEADLINE_URL.test(url)) return;
	event.waitUntil(self.clients.openWindow(url));
});
