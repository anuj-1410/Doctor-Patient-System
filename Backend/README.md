# Doctor Patient Management System

Spring Boot 3 + JWT + Role Based Authentication + MySQL.

## Prerequisites
- Java 17
- Maven
- MySQL

## Database
Create the database:

```sql
CREATE DATABASE doctor_patient_db;
```

## Configure
Update [src/main/resources/application.properties](src/main/resources/application.properties) if your MySQL username or password differs.

## Run
```bash
mvn spring-boot:run
```

## Login
POST http://localhost:8080/api/auth/login

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "<jwt>",
  "role": "ADMIN"
}
```

## Roles
- ADMIN: manage doctors and patients
- DOCTOR: view patients (GET only)

## Doctor APIs (ADMIN)
GET http://localhost:8080/api/doctors

POST http://localhost:8080/api/doctors
```json
{
  "doctorName": "Dr Rahul",
  "specialization": "Cardiologist",
  "email": "rahul@gmail.com"
}
```

## Patient APIs
GET http://localhost:8080/api/patients

POST http://localhost:8080/api/patients (ADMIN only)
```json
{
  "patientName": "Amit",
  "age": 35,
  "disease": "Fever"
}
```

## Postman JWT Steps
1. Call the login API.
2. Copy the token from the response.
3. In Authorization, select Bearer Token and paste the token.
4. Call protected APIs.
