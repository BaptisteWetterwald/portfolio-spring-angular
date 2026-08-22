FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -DskipTests dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

COPY --from=build /workspace/target/portfolio-0.0.1-SNAPSHOT.jar app.jar

ENV SERVER_PORT=8080

EXPOSE 8080

USER spring

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
