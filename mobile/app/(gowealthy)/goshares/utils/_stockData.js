export const ALL_STOCKS = [
  { 
    id: '1',
    name: 'HDFC Bank', 
    symbol: 'HDFCBANK',
    price: 1850, 
    change: 2.5,
    fundsBuying: 847,
    confidence: 92,
    sector: 'Banking',
    marketCap: '10.2L Cr'
  },
  { 
    id: '2',
    name: 'TCS', 
    symbol: 'TCS',
    price: 4120, 
    change: 1.8,
    fundsBuying: 756,
    confidence: 88,
    sector: 'IT Services',
    marketCap: '15.1L Cr'
  },
  { 
    id: '3',
    name: 'Reliance Industries', 
    symbol: 'RELIANCE',
    price: 2890, 
    change: -0.5,
    fundsBuying: 923,
    confidence: 95,
    sector: 'Conglomerate',
    marketCap: '19.5L Cr'
  },
  { 
    id: '4',
    name: 'Infosys', 
    symbol: 'INFY',
    price: 2560, 
    change: 3.2,
    fundsBuying: 689,
    confidence: 85,
    sector: 'IT Services',
    marketCap: '10.8L Cr'
  },
  { 
    id: '5',
    name: 'ICICI Bank', 
    symbol: 'ICICIBANK',
    price: 1245, 
    change: 1.5,
    fundsBuying: 734,
    confidence: 90,
    sector: 'Banking',
    marketCap: '8.7L Cr'
  },
  { 
    id: '6',
    name: 'Bharti Airtel', 
    symbol: 'BHARTIARTL',
    price: 1580, 
    change: 2.1,
    fundsBuying: 612,
    confidence: 87,
    sector: 'Telecom',
    marketCap: '9.2L Cr'
  },
  { 
    id: '7',
    name: 'ITC', 
    symbol: 'ITC',
    price: 485, 
    change: -0.8,
    fundsBuying: 801,
    confidence: 89,
    sector: 'FMCG',
    marketCap: '6.1L Cr'
  },
  { 
    id: '8',
    name: 'State Bank of India', 
    symbol: 'SBIN',
    price: 825, 
    change: 1.2,
    fundsBuying: 712,
    confidence: 86,
    sector: 'Banking',
    marketCap: '7.4L Cr'
  },
  { 
    id: '9',
    name: 'Larsen & Toubro', 
    symbol: 'LT',
    price: 3650, 
    change: 0.9,
    fundsBuying: 654,
    confidence: 84,
    sector: 'Infrastructure',
    marketCap: '5.1L Cr'
  },
  { 
    id: '10',
    name: 'Asian Paints', 
    symbol: 'ASIANPAINT',
    price: 2890, 
    change: -1.2,
    fundsBuying: 598,
    confidence: 82,
    sector: 'Paints',
    marketCap: '2.8L Cr'
  },
];

export const getStockBySymbol = (symbol) => {
  return ALL_STOCKS.find(s => s.symbol === symbol);
};

export const searchStocks = (query) => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return ALL_STOCKS.filter(stock => 
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.symbol.toLowerCase().includes(lowerQuery)
  );
};

export default {};