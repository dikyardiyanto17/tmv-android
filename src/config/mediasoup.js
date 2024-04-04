// Used for VP9 webcam video.
export const VIDEO_KSVC_ENCODINGS = [{ scalabilityMode: "S3T3_KEY" }]

// Used for VP9 desktop sharing.
export const VIDEO_SVC_ENCODINGS = [{ scalabilityMode: "S3T3", dtx: true }]

export const VIDEO_SIMULCAST_PROFILES = {
	3840: [
		{ scaleResolutionDownBy: 12, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 6, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 10000000 },
	],
	1920: [
		{ scaleResolutionDownBy: 6, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 3, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 3500000 },
	],
	1280: [
		{ scaleResolutionDownBy: 4, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 2, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 1200000 },
	],
	640: [
		{ scaleResolutionDownBy: 2, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 500000 },
	],
	320: [{ scaleResolutionDownBy: 1, maxBitRate: 150000 }],
}

export const params = {
	codecOptions: {
		videoGoogleStartBitrate: 1000,
	},
}

export const encodingsVP9 = [{ scalabilityMode: "S3T3" }]

export const encodingVP8 = [
	{ scaleResolutionDownBy: 4, maxBitRate: 1250000, maxFramerate: 60 },
	{ scaleResolutionDownBy: 2, maxBitRate: 1500000, maxFramerate: 60 },
	{ scaleResolutionDownBy: 1, maxBitRate: 2000000, maxFramerate: 60 },
]

export const audioParameters = {
	codecOptions: {
		opusDtx: false,
	},
	zeroRtpOnPause: true,
}
