interface ICheckout {
	step: string;
	page: string;
	token: string;
}
interface IShopify {
	Checkout: ICheckout;
}	
declare const Shopify: IShopify;
