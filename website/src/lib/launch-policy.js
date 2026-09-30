// Source-reviewed locks: public flags cannot approve a paid launch.
export const LAUNCH_REVIEW = Object.freeze({ accountsApproved: false, sellerVerified: false, providerApproved: false, paidTermsApproved: false });
export function launchAvailability(flags, review = LAUNCH_REVIEW) {
 const accounts = flags.accounts === 'true' && review.accountsApproved === true;
 return { accounts, payments: accounts && flags.payments === 'true' && review.sellerVerified === true && review.providerApproved === true && review.paidTermsApproved === true };
}
export function assertAccountsAvailable() { throw new Error('Accounts are paused pending launch review.'); }
export function assertPaymentsAvailable() { throw new Error('Paid services are paused pending seller, provider and terms review.'); }
