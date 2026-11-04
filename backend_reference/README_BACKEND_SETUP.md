# Java Spring Boot & MySQL Backend Setup Guide

This guide provides instructions to run the **Java Spring Boot backend (`onboarding_system`)** alongside MySQL and connect it to the React frontend.

---

## 1. Prerequisites to Install

1. **Java Development Kit (JDK)**: **JDK 17** (LTS) or **JDK 21** (Eclipse Temurin / OpenJDK).
   ```bash
   java -version
   # Expected output: openjdk version "17.0.x"
   ```
2. **Build Tool**: **Apache Maven 3.8+** (or use the included `./mvnw` wrapper).
   ```bash
   mvn -version
   ```
3. **Database**: **MySQL Server 8.0+** and **MySQL Workbench** (or Docker).

---

## 2. Database Initialization (MySQL)

1. Open **MySQL Workbench** (or `mysql -u root -p`).
2. Open and run the provided SQL script:
   - File location: `backend_reference/mysql_schema_and_seed.sql`
3. This creates the database `hrms_db` and seeds:
   - All core tables (`departments`, `employees`, `loginUser`, `bankDetails`, `EducationalDetails`, `experience`, `CompanyAssets`, `user_documents`, `holidays`, `leaves`, `attendance`, `punch_in`, `attendance_record`, `salary_details`)
   - **Library Management tables** (`books`, `book_issuances`, `book_requests`)
   - Pre-configured Admin (`admin` / `admin123`) and Employee (`employee` / `employee123`) test accounts

---

## 3. Configure `application.properties`

Update `onboarding_system/src/main/resources/application.properties`:

```properties
spring.application.name=onboarding_system
server.port=8080
server.address=0.0.0.0

# -------------------------------------------------------------
# Database Connection (Adjust username and password as needed)
# -------------------------------------------------------------
spring.datasource.url=jdbc:mysql://localhost:3306/hrms_db?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YourMySQLPasswordHere
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA & Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# -------------------------------------------------------------
# Unified File Storage Paths (Cross-Platform)
# -------------------------------------------------------------
# Instead of hardcoded C:/ drive paths, use relative or configured paths:
file.upload-dir=uploads/documents/
punchin.image.dir=uploads/selfies/
file.payslip-dir=uploads/pay-slips/
file.profile-dir=uploads/profile-pictures/

# Serve uploaded static resources directly
spring.web.resources.static-locations=file:uploads/selfies/,file:uploads/profile-pictures/

# Multipart File Limits
spring.servlet.multipart.max-file-size=15MB
spring.servlet.multipart.max-request-size=20MB
```

---

## 4. Run the Spring Boot Backend

Navigate to the `onboarding_system` directory in your terminal:

```bash
cd onboarding_system

# On Windows:
./mvnw.cmd clean spring-boot:run

# On Linux / macOS:
./mvnw clean spring-boot:run
```

Once started, the backend runs at `http://localhost:8080`.
Swagger API Docs will be available at: `http://localhost:8080/swagger-ui/index.html`.

---

## 5. Security & User ID Generation Best Practices

1. **User ID Generation**:
   The application derives the User ID from the prefix before `@` in the email:
   ```java
   public String generateUserId(User user) {
       String email = user.getemail_id();
       return email.split("@")[0].trim().toLowerCase();
   }
   ```
   This ensures `admin@company.com` becomes `admin` and `alex.johnson@company.com` becomes `alex.johnson`.

2. **Level-1 Password Security (BCrypt)**:
   In `SecurityConfig.java`, replace `NoOpPasswordEncoder` with `BCryptPasswordEncoder`:
   ```java
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder();
   }
   ```
   When saving a user in `RegistrationController`:
   ```java
   String encodedPassword = passwordEncoder.encode(user.getPassword());
   user.setPassword(encodedPassword);
   ```

3. **CORS Configuration**:
   Ensure `WebConfig.java` allows standard frontend headers:
   ```java
   @Configuration
   public class WebConfig implements WebMvcConfigurer {
       @Override
       public void addCorsMappings(CorsRegistry registry) {
           registry.addMapping("/**")
                   .allowedOrigins("http://localhost:3000", "http://localhost:5173", "*")
                   .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                   .allowedHeaders("*");
       }
   }
   ```

---

## 6. Connecting Frontend to Real Backend

The React frontend includes a **Central Demo Mode switch**:
- **Demo Mode ON**: The app runs offline using full mock in-memory and `localStorage` databases.
- **Demo Mode OFF**: The app makes real HTTP REST calls to `http://localhost:8080`.
- To customize the backend URL in frontend, configure `.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:8080
  ```
