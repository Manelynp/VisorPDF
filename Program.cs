
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// ----
// permitir tipos de archivo ftl para PDF.js
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".ftl"] = "text/plain"; // O "application/octet-stream"
provider.Mappings[".mjs"] = "text/javascript";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});
// ----


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
