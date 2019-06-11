import { COUNTRY_CONFIGURATIONS } from '../../3-infraestructure/database/config/country-configurations';
import { PAYMENTS_CONFIGURATIONS } from '../../3-infraestructure/database/config/payments-configurations';
import { Checker } from '../../3-infraestructure/helper/checker';
import { CountryConfiguration } from '../../3-infraestructure/models/country-configuration';
import { PaymentConfiguration } from '../../3-infraestructure/models/payment-configuration';
import { ShippingCost } from '../../3-infraestructure/models/shipping-cost';
import { ShoppingCart } from '../../3-infraestructure/models/shopping-cart';

export class CheckOutCalculator {
  private readonly countryConfigurations: CountryConfiguration[] = COUNTRY_CONFIGURATIONS;
  private readonly paymentsConfigurations: PaymentConfiguration[] = PAYMENTS_CONFIGURATIONS;
  private readonly discountFactor = 0.9;
  private readonly checker = new Checker();

  constructor( private readonly shoppingCart: ShoppingCart ) { }

  public calculateShippingCosts() {
    const countryConfiguration = this.getCountryConfiguration();
    countryConfiguration.shippingCost.forEach( ( shippingCost: ShippingCost ) => {
      if ( this.hasShippingCost( shippingCost ) ) {
        const shippingCostAmount =
          this.shoppingCart.legalAmounts.amount * shippingCost.factor + shippingCost.plus;
        this.shoppingCart.legalAmounts.amount += shippingCostAmount;
        return;
      }
    } );
  }

  public applyPaymentMethodExtra( payment: string ) {
    const paymentConfiguration: PaymentConfiguration = this.getPaymentConfiguration( payment );
    this.shoppingCart.legalAmounts.amount =
      this.shoppingCart.legalAmounts.amount * paymentConfiguration.extraFactor;
  }

  public applyDiscount() {
    if ( this.hasDiscount() ) {
      this.shoppingCart.legalAmounts.amount *= this.discountFactor;
    }
  }

  private hasShippingCost( shippingCost: ShippingCost ) {
    return this.shoppingCart.legalAmounts.amount < shippingCost.upTo;
  }

  private hasDiscount() {
    return this.shoppingCart.client.isVip || this.hasCountryDiscount();
  }

  private hasCountryDiscount() {
    const countryConfiguration = this.getCountryConfiguration();
    return this.shoppingCart.legalAmounts.amount > countryConfiguration.thresholdForDiscount;
  }

  private getCountryConfiguration() {
    return this.checker.findSafe(
      this.countryConfigurations,
      countryConfiguration =>
        countryConfiguration.countryName === this.shoppingCart.client.country
    );
  }
  private getPaymentConfiguration( payment: string ) {
    return this.checker.findSafe(
      this.paymentsConfigurations,
      paymentConfiguration => paymentConfiguration.paymentMethod === payment
    );
  }
}