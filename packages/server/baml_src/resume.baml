// ============================================
// ENUMS - Typed data for deterministic scoring
// ============================================

enum EducationLevel {
  ENSINO_MEDIO
  TECNOLOGO
  GRADUACAO
  POS_GRADUACAO
  MESTRADO
  DOUTORADO
}

enum EducationStatus {
  COMPLETO
  EM_ANDAMENTO
  TRANCADO
  INCOMPLETO
}

enum EmploymentType {
  CLT
  PJ
  ESTAGIO
  FREELANCE
  VOLUNTARIO
}

enum LanguageProficiency {
  BASICO
  INTERMEDIARIO
  AVANCADO
  FLUENTE
  NATIVO
}

enum SkillCategory {
  PROGRAMMING_LANGUAGE
  FRAMEWORK
  DATABASE
  CLOUD
  DEVOPS
  SOFT_SKILL
  METHODOLOGY
  TOOL
  LANGUAGE
  OTHER
}

// ============================================
// DATA MODELS - Granular structured extraction
// ============================================

class ContactInfo {
  name string
  email string?
  phone string?
  linkedin_url string?
  github_url string?
  portfolio_url string?
  location string?
}

class Education {
  institution string
  degree string
  field_of_study string?
  level EducationLevel
  status EducationStatus
  start_year int?
  end_year int?
}

class Experience {
  company string
  title string
  employment_type EmploymentType?
  start_month int?
  start_year int?
  end_month int?
  end_year int?
  is_current bool
  description string?
  technologies string[]
}

class Skill {
  name string
  category SkillCategory
  years_experience int?
}

class Language {
  name string
  proficiency LanguageProficiency
}

class Certification {
  name string
  issuer string?
  year int?
  expiration_year int?
}

class Project {
  name string
  description string?
  technologies string[]
  url string?
}

// ============================================
// MAIN RESUME MODEL
// ============================================

class Resume {
  contact ContactInfo
  summary string?
  education Education[]
  experiences Experience[]
  skills Skill[]
  languages Language[]
  certifications Certification[]
  projects Project[]
}

// ============================================
// EXTRACTION FUNCTION - LLM as pure OCR
// ============================================

function ExtractResume(document: pdf) -> Resume {
  client CustomGPT5
  prompt #"
    You are a document data extractor. Extract information EXACTLY as written.
    DO NOT infer, reason, or add information not explicitly present.
    If a field is not found, leave it empty or null.

    {{ _.role("user") }}
    {{ document }}

    Extract all information matching the schema.
    For dates, extract only explicitly mentioned years/months.
    For skills, categorize based on the skill name only.

    {{ ctx.output_format }}
  "#
}

// ============================================
// TESTS
// ============================================

test senior_fullstack_resume {
  functions [ExtractResume]
  args {
    document #"
      João Silva
      joao.silva@email.com | (11) 99999-0000
      linkedin.com/in/joaosilva | github.com/joaosilva
      São Paulo, SP

      RESUMO
      Desenvolvedor Full Stack com 8 anos de experiência.

      EXPERIÊNCIA
      Tech Lead - Nubank (CLT)
      Mar 2021 - Atual
      Liderança técnica de squad de 6 pessoas.
      Tecnologias: TypeScript, React, Kotlin, AWS

      Senior Developer - iFood (CLT)
      Jan 2018 - Fev 2021
      Desenvolvimento de microserviços.
      Tecnologias: Java, Spring Boot, PostgreSQL, Kubernetes

      FORMAÇÃO
      Mestrado em Ciência da Computação - USP (2017) - Completo
      Graduação em Sistemas de Informação - UNICAMP (2014) - Completo

      HABILIDADES
      TypeScript, React, Node.js, Kotlin, Java, Spring Boot
      PostgreSQL, MongoDB, Redis
      AWS, Kubernetes, Docker, Terraform
      Scrum, Kanban

      IDIOMAS
      Português - Nativo
      Inglês - Fluente

      CERTIFICAÇÕES
      AWS Solutions Architect Associate - Amazon (2022)
    "#
  }
}
