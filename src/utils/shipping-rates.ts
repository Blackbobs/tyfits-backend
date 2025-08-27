const shippingRates = [
  {
    country: 'US',
    price: 1000,
  },
  { country: 'INTL', price: 5000 },
];

export const getShippingRate = (countryCode: string) => {
    const rate = shippingRates.find(rate => rate.country === countryCode)
    return rate ? rate.price : shippingRates.find(rate => rate.country === "INTL")!.price
}