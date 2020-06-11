declare var dataLayer: Array<Object>;

declare interface DataLayerMessage {
	event?: string;
	category?: string;
	//payment_step?: string;
	error_type?: string;
	error_message?: string;
	gateway_id?: string,
	gateway_label?: string,
	gateway_group?: string;
}