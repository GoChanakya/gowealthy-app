import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { resolveNseScheme } from '../api/fundCards';
import { prettySchemeName } from '../../../lib/schemes';

/**
 * Opens the existing MF fund-detail screen for a card.
 *
 * fund-detail only trusts NSE's own codes (see its header comment), so the
 * card's ISIN is resolved against the live NSE catalogue first and the params
 * are built exactly the way the funds list builds them.
 */
export default function useOpenFund() {
  const router = useRouter();
  const [openingCode, setOpeningCode] = useState(null);

  const openFund = useCallback(async (fund) => {
    if (openingCode) return;
    setOpeningCode(fund.scheme_code);
    try {
      const scheme = await resolveNseScheme(fund);
      if (!scheme) {
        Toast.show({ type: 'info', text1: fund.name, text2: 'This fund is not available to invest in yet.' });
        return;
      }
      const params = new URLSearchParams({
        schemeCode: scheme.scheme_code,
        amcCode: scheme.amc_code,
        fundName: prettySchemeName(scheme.scheme_name),
        minPurchase: String(scheme.min_purchase),
        sipAllowed: scheme.sip_allowed ? '1' : '0',
        schemeType: scheme.scheme_type || '',
        cutoff: scheme.purchase_cutoff_time || '',
        isin: scheme.isin || '',
      });
      router.push(`/(gowealthy)/mf/trading/fund-detail?${params.toString()}`);
    } catch (e) {
      if (__DEV__) console.warn('[fundPicks] NSE lookup failed', e);
      Toast.show({ type: 'error', text1: 'Could not reach the fund list', text2: 'Check your connection and try again.' });
    } finally {
      setOpeningCode(null);
    }
  }, [openingCode, router]);

  return { openFund, openingCode };
}
