import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import './App.css'

const API_KEY = 'demo'
const API_URL = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE'

// Create StockContext
const StockContext = createContext()

// Provider for StockContext
export function StockProvider({ children }) {
  const [stockList, setStockList] = useState([])
  return (
    <StockContext.Provider value={{ stockList, setStockList }}>
      {children}
    </StockContext.Provider>
  )
}

function App() {
  const [stockSymbol, setStockSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const { stockList, setStockList } = useContext(StockContext)

  // Memoized fetch function
  const fetchStockPrice = useCallback(async (symbol) => {
    try {
      const res = await fetch(
        `${API_URL}&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`
      )
      const data = await res.json()
      const priceStr = data['Global Quote']?.['05. price']
      return priceStr ? parseFloat(priceStr) : 'NaN'
    } catch {
      return 'NaN'
    }
  }, [])

  // Fetch current prices for all stocks when stockList changes or on mount
  useEffect(() => {
    const updatePrices = async () => {
      const updatedList = await Promise.all(
        stockList.map(async (stock) => {
          if (stock.symbol === 'NaN') return stock
          const currentPrice = await fetchStockPrice(stock.symbol)
          let profitLoss = 'NaN'
            if (
            currentPrice !== 'NaN' &&
            !isNaN(Number(stock.purchasePrice)) &&
            !isNaN(Number(stock.quantity))
            ) {
            profitLoss = (
              (currentPrice - Number(stock.purchasePrice)) *
              Number(stock.quantity)
            ).toFixed(2)
            }
          return { ...stock, currentPrice, profitLoss }
        })
      )
      setStockList(updatedList)
    }
    if (stockList.length > 0) updatePrices()
    // eslint-disable-next-line
  }, [stockList.length, fetchStockPrice])

  const handleAddStock = async () => {
    const newStock = {
      symbol: stockSymbol.trim() || 'NaN',
      quantity: quantity.trim() || 'NaN',
      purchasePrice: purchasePrice.trim() || 'NaN',
      currentPrice: 'NaN',
      profitLoss: 'NaN'
    }

    // Fetch current price for the new stock
    if (newStock.symbol !== 'NaN') {
      const currentPrice = await fetchStockPrice(newStock.symbol)
      let profitLoss = 'NaN'
      if (
        currentPrice !== 'NaN' &&
        !isNaN(Number(newStock.purchasePrice)) &&
        !isNaN(Number(newStock.quantity))
      ) {
        profitLoss = (
          (currentPrice - Number(newStock.purchasePrice)) *
          Number(newStock.quantity)
        ).toFixed(2)
      }
      newStock.currentPrice = currentPrice
      newStock.profitLoss = profitLoss
    }

    setStockList([...stockList, newStock])
    setStockSymbol('')
    setQuantity('')
    setPurchasePrice('')
  }

  const getDisplayValue = (value, defaultText, fieldName) => {
    if (focusedField === fieldName) {
      return value
    }
    return value || defaultText
  }

  return (
    <>
      <h1>Finance Dashboard</h1>
      <div className="horizontal-fields-container">
        <div className="text-field">
          <input
            type="text"
            value={getDisplayValue(stockSymbol, 'Stock Symbol', 'stockSymbol')}
            onChange={(e) => setStockSymbol(e.target.value)}
            onFocus={() => setFocusedField('stockSymbol')}
            onBlur={() => setFocusedField(null)}
            className="field-input"
          />
        </div>
        <div className="text-field">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="field-input"
            min="0"
            step="any"
          />
        </div>
        <div className="text-field">
          <input
            type="text"
            value={getDisplayValue(purchasePrice, 'Purchase Price', 'purchasePrice')}
            onChange={(e) => setPurchasePrice(e.target.value)}
            onFocus={() => setFocusedField('purchasePrice')}
            onBlur={() => setFocusedField(null)}
            className="field-input"
          />
        </div>
        <button onClick={handleAddStock} className="add-stock-button">
          Add Stock
        </button>
      </div>

      <div className="stock-list-section">
        <h2 className="stock-list-header">Stock List</h2>
          {stockList.length === 0 ? (
    <div className="stock-list-status" style={{ color: "#000000", fontStyle: "italic", margin: "1em 0" }}>
      No stocks added yet. Please add a stock to get started.
    </div>
  ) : (
        stockList.map((stock, index) => (
          <div key={index} className="stock-list-item" style={{marginBottom: "1em", padding: "0.5em", border: "1px solid #ccc", borderRadius: "4px"}}>
            <div><b>Symbol: {stock.symbol}</b></div>
            <div>Quantity: {stock.quantity}</div>
            <div>Purchase Price: {stock.purchasePrice}</div>
            <div>Current Price: {stock.currentPrice}</div>
            <div><b>
              Profit/Loss:{" "}</b>
              <span
                style={{
                  color: 
                    !isNaN(Number(stock.profitLoss))
                      ? Number(stock.profitLoss) > 0
                        ? "green"
                        : Number(stock.profitLoss) < 0
                        ? "red"
                        : "inherit"
                      : "inherit"
                }}
              >
                {
                  !isNaN(Number(stock.profitLoss)) && Number(stock.profitLoss)
                    ? <b>{stock.profitLoss}</b>
                    : stock.profitLoss
                }
                
              </span>
            </div>
          </div>
        )))}
      </div>
    </>
  )
}

export default function AppWithProvider() {
  return (
    <StockProvider>
      <App />
    </StockProvider>
  )
}