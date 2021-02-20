package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/go-rod/rod"
)

type body struct {
	Content string `json:"content"`
}

var _tailwind string

func tailwind() error {
	if len(_tailwind) == 0 {
		res, err := http.Get("https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css")
		if err != nil {
			return nil
		}
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			return nil
		}
		_tailwind = string(body)
	}
	fmt.Println("Tailwind loaded")
	return nil
}

func main() {

	if err := tailwind(); err != nil {
		fmt.Println(err.Error())
		return
	}
	doTheMainThing()
}

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500&display=swap" rel="stylesheet">
    <style>
        %s
    </style>
</head>
<body>
    %s
</body>
</html>
`

func buildTemplate(content string) string {
	return fmt.Sprintf(htmlTemplate, _tailwind, content)
}

type littleServer struct {
	content string
}

func (s littleServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(buildTemplate(s.content)))
}

func littleServe(content string, port int) {
	http.ListenAndServe(":"+strconv.Itoa(port), littleServer{content})
}

func doTheThing(content string) []byte {
	port := 18912
	go littleServe(content, port)
	page := rod.New().MustConnect().MustPage("http://localhost:" + strconv.Itoa(port))
	return page.MustWaitLoad().MustPDF("file.pdf")
}

func doTheMainThing() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Allow CORS here By * or specific origin
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Headers", "Authorization")
		}

		if r.Method != "POST" {
			http.Error(w, "Invalid method", 400)
			return
		}
		b, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		var body body

		err = json.Unmarshal(b, &body)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		if len(body.Content) == 0 {
			http.Error(w, "Invalid body.", 400)
			return
		}
		w.Header().Set("Content-Type", r.Header.Get("Content-Type"))
		w.Header().Set("Content-Disposition", "attachment; filename=resume.pdf")
		w.Header().Set("Content-Length", r.Header.Get("Content-Length"))
		w.Write(doTheThing(body.Content))
	})

	fmt.Println("server started on port 8080")
	http.ListenAndServe(":8080", nil)
}
