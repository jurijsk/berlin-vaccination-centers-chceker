interface ICheckout {
	step: string;
	page: string;
}
interface IShopify {
	Checkout: ICheckout;
}	
declare const Shopify: IShopify;
