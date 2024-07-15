// reserved: referrer, landing_page, optin_page (COMING SOON)

let sdStorage = localStorage.getItem('sd.params') ? JSON.parse(localStorage.getItem('sd.params')) : {};

const sdNowParams = new URLSearchParams(window.location.search);
const sdParams = [...sdNowParams].reduce((a, [k, v]) => ((a[k] = v), a), {});
const sdFilteredParams = Object.keys(sdParams)
	.filter((key) => Object.keys(window.attributionMappings).includes(key))
	.reduce((obj, key) => {
		return Object.assign(obj, { [key]: sdParams[key] });
	}, {});
sdStorage = { ...sdFilteredParams, ...sdStorage };

delete sdStorage.ck_subscriber_id;
if (!sdStorage.referrer && document.referrer && !document.referrer.includes(document.location.hostname))
	sdStorage.referrer = document.referrer;
if (!sdStorage.landing_page) sdStorage.landing_page = window.location.href.split('?')[0];

localStorage.setItem('sd.params', JSON.stringify(sdStorage));

document.addEventListener('rm:identify', function (payload) {
	const data = payload.detail.data;
	console.log('[S&D ID]', data);
	if (!data.isAnonymous) {
		const toSync = JSON.parse(JSON.stringify(sdStorage));

		Object.keys(data.customFields).forEach((key) => {
			if (toSync[key] && data.customFields[key]) {
				delete toSync[key];
			}

			if (!Object.keys(window.attributionMappings).includes(key)) {
				delete toSync[key];
			}
		});

		const fieldUpdates = Object.keys(toSync).map((key) => {
			return { fieldId: window.attributionMappings[key], value: toSync[key] };
		});

		if (fieldUpdates.length > 0 && sdNowParams.get('email')) {
			console.log('[S&D SYNC]', fieldUpdates);
			fetch(`https://dmm.rightmessage.com/${window.accountId}/convertkit/` + data.subscriberId, {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(fieldUpdates),
			});
		}
	}
});
