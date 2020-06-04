function PaymentMethodAnalisysExt() {
	console.log("loading PMA");
	'use strict';
	const debuging = true;
	const eventCategory = 'payment_method';
	const paymentMethodsSection = ".section--payment-method";
	const paymentMethodRowSelector = " [data-select-gateway]";

	const CheckoutSteps = {payment_method: 'payment_method', processing: 'processing', review: 1  };
	const CheckoutPages = {processing: 1, forward: 1, thank_you: 1};


	const EventActions = {
		MethodSelected: 'payment_method_selected',
		PaymentIntent: 'payment_intent',
		PaymentFailed: 'payment_failed',
		Pageview: 'pma_pageview',
	}

	let log = function log(msg: string){
		console.log("PMA: " + msg);
	};
	let debug = function debug(msg: string){
		debuging && console.log("PMA: " + msg);
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
		if(!radioButton){
			radioButton = document.querySelector(`${paymentMethodsSection} input[type='radio'][checked]`) as HTMLInputElement;
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
				'event': EventActions.MethodSelected
			};

			let gatewayParam = collectGatewayParams(radioButton as HTMLInputElement);
			Object.assign(event, gatewayParam);
			track(event);
		}

		document.querySelectorAll(`${paymentMethodsSection} input[type='radio']`)
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

	var track = function track(event: GTMTrackingEvent) {
		event.category = event.category || eventCategory;
		if(event.event != 'error') {
			context.lastEvent = event.event;
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
				'event': EventActions.PaymentIntent,
			};
			let gatewayParam = collectGatewayParams();
			Object.assign(event, gatewayParam);
			track(event);
		};

		button.addEventListener('click', continueButtonClickHandler);
	};

	const context = {
		lastEvent: null,
		currentCheckoutStep: null
	};
	let onLoad = function onLoad() {
		debug(`on load handler`);
		
		if(Shopify.Checkout.page in CheckoutPages || Shopify.Checkout.step in CheckoutSteps){
			let event = {
				'event': EventActions.Pageview,
				'chekout_step': Shopify.Checkout.step,
				'chekout_page': Shopify.Checkout.page
			};
			let gatewayParam = collectGatewayParams();
			Object.assign(event, gatewayParam);
			track(event);
		}
	}
	let onChange = function onChange(){
		debug(`on load handler`);
	}

	let firePaymentFailure = function firePaymentFailure() {
		//it is tricky to track failed attempts to pay because methods 
		//because the are lot of ways how methods implemented
		//some methods redirect user to externla page and then redirect back in failure (klarna, paypal)
		//some require to enter card retails with on the payment method page (amex)
		//ather redirect /payments page

		let referrer = new URL(document.referrer);
	};

	var init = function init() {
		console.log("PaymentMethodAnalisysExt initialization");

		window.dataLayer = window.dataLayer || [];
		if(!Shopify || !Shopify.Checkout) {
			return;
		}
		context.currentCheckoutStep = Shopify.Checkout.step;

		document.addEventListener('page:load', onLoad);
		document.addEventListener('page:change', onChange);

		if(context.currentCheckoutStep == CheckoutSteps.payment_method) {
			document.addEventListener('page:load', setupPaymentMethodSelectionTracking);
			document.addEventListener('page:change', setupPaymentMethodSelectionTracking);

			document.addEventListener('page:load', setupPaymentIntentTracking);
			document.addEventListener('page:change', setupPaymentIntentTracking);

			document.addEventListener('page:load', firePaymentFailure);
			document.addEventListener('page:change', firePaymentFailure);
		}


	};
	init();
	console.log("PMA is up and running");
}