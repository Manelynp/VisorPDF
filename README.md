# VisorPDF – PDF Form Editor & Data Processing Tool

A collaborative web development project created during a 140-hour Frontend Development internship at **Evolk Bigo Solutions**, Vigo, Spain (March–April 2026).

VisorPDF extends the frontend functionality of the company's existing ASP.NET MVC application. The project focuses on displaying PDF documents, working with fillable PDF forms, extracting user-entered data and preparing it in JSON format for future backend processing.

## Project Overview

The project was developed by a team of three students. One of the main technical challenges was finding free JavaScript libraries that could support PDF visualization, form field extraction and document interaction within the existing application.

The team researched and tested different approaches, focusing particularly on **PDF.js** and **pdf-lib**.

The intended workflow was to load a client's completed PDF form, identify its fields, extract the entered information and organize the results into structured JSON data.

## Features

The collaborative project includes the following functionality:

- **PDF Visualization:** Load and display PDF documents within the web application.
- **Form Field Processing:** Identify editable PDF form fields and retrieve their values.
- **Data Extraction:** Extract field names and user-entered information.
- **JSON Preparation:** Organize extracted form data into a structured JSON object.
- **Digital Signature Handling:** Capture signature input and convert it into Base64 format.
- **PDF Annotations:** Support ink annotations and PDF document interaction.
- **Processing State:** Track PDF modification and saving status using `fp=true` and `fp=false`.

## My Contribution

As part of the three-student development team, my main focus was frontend functionality and PDF form data extraction.

My contributions included:

- Developing and adapting frontend functionality using HTML, CSS and JavaScript within the existing application.
- Researching and testing PDF.js and pdf-lib to load PDF documents, identify form fields and retrieve their values.
- Working on JavaScript logic to organize extracted form information into JSON format.
- Testing and checking the extracted JSON output through the browser console.
- Collaborating with a teammate on PDF loading and data extraction, while coordinating with the rest of the team on the overall document-processing workflow.

The signature functionality, including signature capture and Base64 conversion, was another part of the team's work.

**Project scope:** The internship focused on frontend development and preparing PDF form data for future backend integration. The extracted JSON was tested in the browser console; full backend integration was outside the scope of my contribution.

## Technologies & Tools

**Frontend**
- HTML5
- CSS3
- JavaScript
- Bootstrap
- jQuery

**PDF Processing**
- PDF.js
- pdf-lib
- JSON
- Base64

**Application & Development Environment**
- ASP.NET MVC
- C#
- Visual Studio 2022
- .NET 8

## Main Technical Challenges

One of the main challenges was finding suitable free tools for working with interactive PDF documents.

The team explored how to:

1. Load and display PDF documents.
2. Access the fields of fillable PDF forms.
3. Retrieve the values entered by users.
4. Convert the extracted information into structured JSON.
5. Prepare the data for further processing by the backend.

Working within an existing ASP.NET MVC application also required understanding its frontend structure and adapting JavaScript functionality to the established codebase.

## Project Structure

```text
VisorPDF/
├── Controllers/
├── Models/
├── Properties/
├── Views/
├── wwwroot/
│   ├── css/
│   ├── js/
│   └── ...
├── Program.cs
├── VisorPDF.csproj
├── appsettings.json
└── .gitignore
```

## Running the Project Locally

### Requirements

- .NET 8 SDK
- Visual Studio 2022 or another compatible .NET development environment

### Installation

Clone the repository:

```bash
git clone https://github.com/Manelynp/VisorPDF.git
```

Navigate to the project directory:

```bash
cd VisorPDF
```

Build the application:

```bash
dotnet build
```

Run the application:

```bash
dotnet run
```

Open the local URL displayed in the terminal.

## Internship Context

**Company:** Evolk Bigo Solutions  
**Location:** Vigo, Spain  
**Role:** Frontend Developer Intern  
**Duration:** March–April 2026  
**Hours:** 140 hours  
**Project Type:** Collaborative team project (3 students)

This internship provided practical experience in JavaScript development, DOM manipulation, PDF processing, form data extraction, JSON structuring, debugging and collaborating within an existing ASP.NET MVC application.

---

*This project was developed collaboratively as part of a professional training internship.*
