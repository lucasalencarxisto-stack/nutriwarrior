plugins {
<<<<<<< HEAD
    id("java")  
    id("org.springframework.boot") version "3.3.2"  
    id("io.spring.dependency-management") version "1.1.5"   
=======
    id("java")
    id("org.springframework.boot") version "3.3.2"
    id("io.spring.dependency-management") version "1.1.5"
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)
}

group = "com.lucas"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
<<<<<<< HEAD
    }

    repositories {
       mavenCentral()
    }

   dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}


    
=======
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.test {
    useJUnitPlatform()
}
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)
