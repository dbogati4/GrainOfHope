# GrainOfHope
The project highlights the state of world hunger while inspiring individuals to join the fight against it.
Application geneated the real-world data from the Global Hunger Index (https://www.globalhungerindex.org/) and the prediction is made on the real data. 


** Model details: **
Ridge Regression (L2-regularized linear regression) using sklearn.linear_model.Ridge.
Features: one-hot country, numeric year, and country×year interaction terms to give each country its own intercept and slope.
Regularization (alpha=10.0) stabilizes fits with only four anchor years and reduces overfitting, yielding differentiated 2025–2035 forecasts.

To setup the project for the backend:
python -m venv venv

cd venv/Scripts

./activate

cd ../..

python -m pip install -r requirements.txt


To run the server:

uvicorn main:app --reload

