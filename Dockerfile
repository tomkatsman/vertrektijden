# Gebruik de officiële Apache-image
FROM httpd:latest

# Kopieer de bestanden naar de juiste directory in de container
COPY . /usr/local/apache2/htdocs/
