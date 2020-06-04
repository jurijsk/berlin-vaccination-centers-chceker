declare var dataLayer: Array<Object>;

declare interface GTMTrackingEvent {
	event: string;
	category?: string;
	[key: string]: string | number;
}