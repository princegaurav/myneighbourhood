# Kolkata - City of Joy [Udacity Neighbourhood Project]

This is a single page application featuring a map of my neighborhood (my city), Kolkata. The application shows places of interest and includes a map with  highlighted locations. The list can be filtered using a search bar or dropdown menu. When you click a marker, it displays information about that place using Wikipedia API.

## How to run
Serve the files using a Web Server.
You can start the web server using the following command

```bash
$> cd /path/to/your-project-folder
$> python -m SimpleHTTPServer 8080
```
Just open the `index.html` file in a web browser and you are all set to interact with the web app.
i.e. `http://localhost:8080/` when using a web server on port 8080.

## Features
* The application displays 10 places of interest in Kolkata city. It reads this information from a `json` file.
* When the button displaying places is clicked, the corresponding marker on map changes color and bounces.
* When a marker on map is clicked, information regarding the place is shown. The text is retrieved using Wikipedia API.
* The list of places and their corresponding markers can be filtered using the Search Bar and Dropdown menu. It applies both the filters to the list.
* The web app is responsive.
