import io
import base64
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend for server
import matplotlib.pyplot as plt

app = FastAPI()

class Expense(BaseModel):
    amount: float
    date: str # ISO format string or just sequential month indices
    category: str

class UserExpenses(BaseModel):
    userId: str
    expenses: List[Expense]

@app.post("/api/ml/predict-expenses")
async def predict_expenses(data: UserExpenses):
    if len(data.expenses) < 2:
        return {"success": False, "error": "Not enough data to train the model. Add more expenses."}
    
    # 1. Prepare Data
    # Convert to DataFrame
    df = pd.DataFrame([e.dict() for e in data.expenses])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Aggregate by Month
    df['month'] = df['date'].dt.to_period('M')
    monthly_totals = df.groupby('month')['amount'].sum().reset_index()
    
    if len(monthly_totals) < 2:
         return {"success": False, "error": "Need expenses spanning at least two different months for prediction."}

    # Use index as the feature (Time variable)
    X = np.arange(len(monthly_totals)).reshape(-1, 1)
    y = monthly_totals['amount'].values

    # 2. Train Model (scikit-learn)
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next month
    next_month_index = np.array([[len(monthly_totals)]])
    prediction = model.predict(next_month_index)[0]

    # 3. Generate Chart (matplotlib)
    plt.figure(figsize=(8, 5))
    
    # Change background colors to be transparent/glassy looking
    fig = plt.gcf()
    fig.patch.set_alpha(0.0)
    ax = plt.gca()
    ax.patch.set_alpha(0.0)
    
    # Set axis colors
    ax.tick_params(colors='#1e293b')
    for spine in ax.spines.values():
        spine.set_color('#1e293b')
        spine.set_alpha(0.2)
    
    # Plot historical data
    plt.plot(X, y, marker='o', label='Historical Expenses', color='#10b981', linewidth=2)
    
    # Plot trend line
    trend_X = np.arange(len(monthly_totals) + 1).reshape(-1, 1)
    trend_y = model.predict(trend_X)
    plt.plot(trend_X, trend_y, linestyle='--', label='Trend', color='#6366f1')
    
    # Plot Prediction
    plt.scatter([len(monthly_totals)], [prediction], color='#ef4444', s=100, label='Next Month Prediction', zorder=5)

    plt.title('Expense Trend & Prediction', color='#1e293b', fontweight='bold')
    plt.xlabel('Months (Sequential)', color='#1e293b')
    plt.ylabel('Amount ($)', color='#1e293b')
    plt.xticks(color='#1e293b')
    plt.yticks(color='#1e293b')
    
    legend = plt.legend()
    plt.setp(legend.get_texts(), color='#1e293b')
    
    plt.grid(True, linestyle=':', alpha=0.3, color='#1e293b')
    plt.tight_layout()

    # Save plot to base64 string
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True, dpi=120)
    buf.seek(0)
    chart_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return {
        "success": True,
        "prediction": max(0, float(prediction)), # Avoid negative predictions
        "chartData": f"data:image/png;base64,{chart_base64}"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
