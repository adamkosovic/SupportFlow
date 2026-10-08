# Bygg Angular
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npx --yes npm@11 ci

COPY frontend/ ./
RUN npm run build

# Bygg ASP.NET
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src

COPY backend/SupportFlow.Api/SupportFlow.Api.csproj backend/SupportFlow.Api/
RUN dotnet restore backend/SupportFlow.Api/SupportFlow.Api.csproj

COPY backend/ backend/

COPY --from=frontend-build /frontend/dist/supportflow-web/browser/ backend/SupportFlow.Api/wwwroot/

RUN dotnet publish backend/SupportFlow.Api/SupportFlow.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

# Kör appen
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=backend-build /app/publish/ ./

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "SupportFlow.Api.dll"]