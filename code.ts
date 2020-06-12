interface PMAContext {
	lastEvent: string,
	gateway_label: string
	gateway_id: string;
	payment_step: string;
} 
(function PaymentMethodAnalisys() {
	const debuging = false;

	let log = function log(msg: string) {
		console.log("PMA: " + msg);
	};
	let debug = function debug(msg: string) {
		debuging && console.log("PMA: " + msg);
	}

	'use strict';

	const storage_key = 'pma_key';
	var store = function store(value: PMAContext) {
		if(!window.Storage) {
			var expiresDate = new Date();
			expiresDate.setDate(expiresDate.getDate() + 1);
			document.cookie = storage_key + '=' + value + ';expires=' + expiresDate.toUTCString();
		} else {
			window.localStorage.setItem(storage_key, JSON.stringify(value));
		}
	};
	var restore = function restore(): PMAContext {
		let value: string = null;
		if(!window.Storage) {
			value = '; ' + document.cookie;
			var parts = value.split('; ' + storage_key + '=');
			if(parts.length === 2) {
				value = parts.pop().split(';').shift();
			}
		} else {
			value = window.localStorage.getItem(storage_key);
		}
		return JSON.parse(value);
	};
	var clear = function clear(){
		if(!window.Storage){
			document.cookie = storage_key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}else{
			window.localStorage.removeItem(storage_key);
		}
	}

	const paymentMethodsSection = ".section--payment-method input[type='radio']";
	const paymentMethodRowSelector = " [data-select-gateway]";

	const CheckoutSteps = {payment_method: 'payment_method', forward: 'forward', processing: 'processing', thank_you: 'thank_you' , review: 'review'};

	const PaymentSteps = {
		PayemntMethodView: 'payment_method_view',
		MethodSelected: 'payment_method_selected',
		PaymentIntent: 'payment_intent',
		Processing: 'payment_processing',
		IntentCancelled: 'payment_intent_cancelled',
		Paymentsuccessful: 'payment_successful',
	}
	
	const getGatewayId = function getGatewayId(element) {
		if(!element) {
			return;
		}
		return element.getAttribute("data-select-gateway");
	}
	const getGatewayGroup = function getGatewayGroup(element) {
		if(!element) {
			return;
		}
		return element.getAttribute("data-gateway-group");
	}

	const getGatewayLabel = function getGatewayLabel(element) {
		if(!element) {
			return;
		}
		return element.textContent.trim();
	}

	var collectGatewayParams = function collectGatewayParams(radioButton?: HTMLInputElement) {
		const errorType = 'collect_gateway_params';
		const gatewayParams = {
			gateway_id: null,
			gateway_label: null,
			gateway_group: null
		};
		if(!radioButton) {
			let radioButtons = document.querySelectorAll<HTMLInputElement>(paymentMethodsSection);
			for(let i = 0; i < radioButtons.length; i++) {
				if(radioButtons[i].checked){
					radioButton = radioButtons[i];
					continue;
				}
			}
		}

		if(!radioButton) {
			reportError(errorType, 'Selection element not found. Can not specify gateway params');
			return gatewayParams;
		}

		const label = radioButton.labels ? radioButton.labels[0] : null;
		if(!label) {
			reportError(errorType, 'Selected payment method label not found. Can not specify gateway label');
		} else {
			const gatewayLabel = getGatewayLabel(label);
			gatewayLabel && (gatewayParams.gateway_label = gatewayLabel);
		}
		if(!radioButton.closest) {
			reportError(errorType, 'Can not find parent element. Can not specify gateway params');
		} else {
			let paymentMethodRow = radioButton.closest(paymentMethodRowSelector);
			if(!paymentMethodRow) {
				reportError(errorType, 'Selected payment data not found. Can not specify gateway params');
			}
			const id = getGatewayId(paymentMethodRow);
			id && (gatewayParams.gateway_id = id);
			const group = getGatewayGroup(paymentMethodRow);
			group && (gatewayParams.gateway_group = group);
		}
		return gatewayParams;
	}

	var setupPaymentMethodSelectionTracking = function setupPaymentMethodSelectionTracking() {
		const errorType = 'payment_method_selection';
		var paymentMethodChangedHandler = function paymentMethodChangedHandler(eventArgs) {
			var radioButton = eventArgs.currentTarget;
			if(radioButton.type != "radio") {
				reportError(errorType, 'Can not find selection element. Can not update DL gateway params');
				return;
			}
			if(!radioButton.checked) {
				return;
			}
			let event = {
				event: PaymentSteps.MethodSelected,
			} as DataLayerMessage;

			let gatewayParam = collectGatewayParams(radioButton as HTMLInputElement);
			context.gateway_label = gatewayParam.gateway_label;
			context.gateway_id = gatewayParam.gateway_id;
			Object.assign(event, gatewayParam);
			track(event);
		}

		document.querySelectorAll(paymentMethodsSection)
			.forEach((element) => {
				element.addEventListener("change", paymentMethodChangedHandler)
			});
	}

	var reportError = function reportError(type: string, message: string) {
		debug(`(${type}) ${message}`);
		track({
			'event': 'error',
			'error_type': type,
			'error_message': message
		});
	}

	var track = function track(event: DataLayerMessage) {
		if(event.event != 'error') {

		}
		debug(`track(): ${JSON.stringify(event)}`);
		window.dataLayer.push(event);
	}

	let setupPaymentIntentTracking = function setupPaymentIntentTracking() {
		const errorType = 'payment_method_selection';
		let button = document.getElementById("continue_button");
		if(!button) {
			reportError(errorType, 'continue_button not found. Could not subscripbe to payment intent event');
			return;
		}

		const continueButtonClickHandler = function continueButtonClickHandler() {
			let event = {
				event: PaymentSteps.PaymentIntent
			};
			let gatewayParam = collectGatewayParams();
			Object.assign(event, gatewayParam);
			context.gateway_label = gatewayParam.gateway_label;
			context.gateway_id = gatewayParam.gateway_id;
			store(context);
			track(event);
		};

		button.addEventListener('click', continueButtonClickHandler);
	};

	let context: PMAContext;
	let fireCheckoutStepEvent = function fireCheckoutStepEvent() {

		//debug(`fireCheckoutStepEvent`);
		//let step = 'unknown';
		let shopifyStep = 'unknown';
		let paymentStep = 'unknown';

		if(Shopify.Checkout && Shopify.Checkout.step in CheckoutSteps) {
			shopifyStep = Shopify.Checkout.step;
			if(shopifyStep == CheckoutSteps.processing || shopifyStep == CheckoutSteps.forward){
				//amex does processing, others do forwarding => unifyinf
				shopifyStep = CheckoutSteps.processing;
			}
			const previousPaymentStep = context.payment_step;
			if(shopifyStep == CheckoutSteps.payment_method){
				//if previous step was processing it means that user had a cancelleation: went back, declined or otherwise
				if(previousPaymentStep == PaymentSteps.Processing){
					paymentStep = PaymentSteps.IntentCancelled;
				} else {
					paymentStep = PaymentSteps.PayemntMethodView;
				}
			} else if(shopifyStep == CheckoutSteps.thank_you){
				paymentStep = PaymentSteps.Paymentsuccessful;
			} else if(shopifyStep == CheckoutSteps.processing){
				if(previousPaymentStep == CheckoutSteps.processing){
					//no need to report it twice;
					return;
				}
				paymentStep = PaymentSteps.Processing;
			} else if(!(shopifyStep in CheckoutSteps)) {
				debug("clearing the store. (1)");
				clear();
			} else {
				debug("Some other step: " + shopifyStep);
			}
			context.payment_step = paymentStep;
			store(context);
			let event: DataLayerMessage = {
				event: paymentStep,
				gateway_label: context.gateway_label,
				gateway_id: context.gateway_id
			}
			track(event);

			if(shopifyStep == CheckoutSteps.thank_you){
				clear();
			}
		} else {
			if(!document.location.hostname.startsWith("checkout.") //checkout.storename.com
				|| !document.location.pathname.startsWith('/apps/w/pay')) { //visa/master with https://app-wallee.com
				debug("clearing the store. (2)");
				clear();
			}
		}
	}

	let onChange = function onChange() {
		log(`on load handler`);
	}

	let logNavigation = function logNavigation(){
		if(!document.location.hostname.startsWith("checkout.")){
			return;
		}

		let shopify_step = 'unknown';
		let shopify_page = 'unknown';
		if(Shopify && Shopify.Checkout){
			shopify_step = Shopify.Checkout.step;
			shopify_page = Shopify.Checkout.page;
		}

		let msg = `(log) step: ${shopify_step}; page: ${shopify_page}; referrer: ${document.referrer}`;
		track({
			event: 'navlog',
			category: 'Log',
			label: msg,
			gateway_label: context.gateway_label,
			gateway_id: context.gateway_id
		});
	}

	let init = function init() {
		context = restore() || {} as PMAContext;
		logNavigation();
		if(Shopify && Shopify.Checkout) {
			debug('(init) shopify step: ' + Shopify.Checkout.step + " and page:  " + Shopify.Checkout.page);
		} else {
			debug('(init) No Shopify.Checkout exits');
		}
		window.dataLayer = window.dataLayer || [];
		
		fireCheckoutStepEvent();
		document.addEventListener('page:change', onChange);
		if(Shopify && Shopify.Checkout && Shopify.Checkout.step == CheckoutSteps.payment_method) {
			setupPaymentMethodSelectionTracking();
			setupPaymentIntentTracking();
		}
	};
	init();
})();