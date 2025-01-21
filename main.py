from fastapi import FastAPI
import requests

app = FastAPI()
# Enable CORS
""" app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
"""
# API URL
API_BASE_URL = "http://localhost:8080"  # Cambia el puerto si usaste otro


@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de la nueva aplicación"}

@app.get("/workitems")
async def get_work_items(state: str = None):
    """
    Endpoint para consumir work items desde la API.
    """
    try:
        # Realiza una solicitud GET al endpoint de la API
        url = f"{API_BASE_URL}/api/v1/workitems/work-items"
        print(f"Solicitando a la API: {url}")
        response = requests.get(url)
        response.raise_for_status()

        # Procesar los datos obtenidos
        data = response.json()
        print(f"Respuesta de la API: {data}")

        # Aplicar filtros
        if state:
            data = [item for item in data if item.get("fields", {}).get("System.State") == state]

        return data

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

""" # Models
class Ticket(BaseModel):
    id: int
    title: str
    status: str
    description: Optional[str] = None

# Sample data
tickets = [
    Ticket(id=1, title="Network Issue", status="incomplete", description="Connection failure in the main network"),
    Ticket(id=2, title="Software Update", status="incomplete", description="Pending system updates"),
]

if __name__ == "__main__": 
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) """