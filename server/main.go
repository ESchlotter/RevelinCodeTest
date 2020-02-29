package main

import (
	"crypto/sha1"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	handleRequests()
}

func handleRequests() {
	http.HandleFunc("/api", homePage)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

type Request struct {
	EventType			string				`json:"eventType"`
	WebsiteUrl         	string   			`json:"websiteUrl"`
	SessionId          	string				`json:"sessionId"`
	ResizeFrom         	Dimension			`json:"resizeFrom"`
	ResizeTo           	Dimension			`json:"resizeTo"`
	Pasted      	 	bool 				`json:"pasted,omitempty"`
	FormId				string				`json:"formId,omitempty"`
	FormCompletionTime 	int 				`json:"time,omitempty"`	// Seconds
}

type Data struct {
	WebsiteUrl         	string   			`json:"websiteUrl"`
	SessionId          	string				`json:"sessionId"`
	ResizeFrom         	Dimension			`json:"resizeFrom,omitempty"`
	ResizeTo           	Dimension			`json:"resizeTo,omitempty"`
	CopyAndPaste       	map[string]bool // map[fieldId]true
	FormCompletionTime 	int 				`json:"time,omitempty"`	// Seconds
}

type Dimension struct {
	Width  string
	Height string
}

func homePage(w http.ResponseWriter, r *http.Request){
	if r.Method == "POST" {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Unable to read body"))
			return
		}

		req := &Request{}
		data := &Data{}
		data.CopyAndPaste = make(map[string]bool)

		if err = json.Unmarshal(body, req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Unable to unmarshal JSON request"))
			return
		}
		log.Printf("Request received %+v", req)

		if err = json.Unmarshal(body, data); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Unable to unmarshal JSON request"))
			return
		}

		if req.EventType == "copyAndPaste" {
			data.CopyAndPaste[req.FormId] = req.Pasted
		}
		log.Printf("Data constructed %+v", data)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("{}"))

		log.Printf("Hash of %+v : %x\n", data.WebsiteUrl, calculateHash(data.WebsiteUrl))
	} else {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Only supports POST requests"))
	}
}

func calculateHash(text string) []byte {
	hash := sha1.New()
	hash.Write([]byte(text))
	return hash.Sum(nil)
}