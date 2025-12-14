// Defining a data model for resume parsing.
class Resume {
  name string
  email string
  experience string[]
  skills string[]
}

// Extract structured resume data from a PDF document.
function ExtractResume(document: pdf) -> Resume {
  client CustomGPT5
  prompt #"
    You are a resume parser. Extract the following information from this resume PDF document.

    {{ _.role("user") }} {{ document }}

    Extract:
    - Full name of the candidate
    - Email address
    - List of work experiences (company and role, e.g., "Software Engineer at Google")
    - List of skills mentioned

    {{ ctx.output_format }}
  "#
}



// Test the function with a sample resume. Open the VSCode playground to run this.
test vaibhav_resume {
  functions [ExtractResume]
  args {
    resume #"
      Vaibhav Gupta
      vbv@boundaryml.com

      Experience:
      - Founder at BoundaryML
      - CV Engineer at Google
      - CV Engineer at Microsoft

      Skills:
      - Rust
      - C++
    "#
  }
}
