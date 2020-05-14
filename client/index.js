import $ from "jquery";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.css"; // Import precompiled Bootstrap css
import "./style.css";
const API_HOST = "http://localhost:3000";

const APP = {
    http: {
        get(url, data) {
           return this.request('get', url, data);
        },
        post(url, data) {            
           return this.request('post', url, data);
        },
        put(url, data) {            
           return this.request('put', url, data);
        },
        request(type, url, data) {
            return $.ajax({
                type,
                url: API_HOST + url,
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
                crossDomain: true,
            });
        }
    },
    userId: localStorage.getItem("user_id"),
    isLoggedIn: false,
    userData: {},
    init() {
        if (this.userId) {
            this.getCurrentUserData();
        } else {
            this.draw();
        }
        $('[href="#sign-up-link"]').on("click", (e) => {
            e.preventDefault();
            $("#log-in").hide();
            $("#sign-up").show();
        });
        $(".logIn-form").on("submit", (e) => {
            e.preventDefault();
            const data = {
                email: $(`.logIn-form [name="email"]`).val(),
                password: $(`.logIn-form [name="password"]`).val(),
            };
            this.http
                .post("/login", data)
                .then((data) => {
                    localStorage.setItem("user_id", data.userId);                    
                    this.userId = data.userId;
                    this.getCurrentUserData();
                })
                .catch((message) => {});
        });
        $('#logout').on('click', () => {
            this.isLoggedIn = false;
            this.userId = '';
            localStorage.setItem("user_id", '');
            this.draw();
        });
        $('#sign-up-form').on('submit', (e) => {
            e.preventDefault();
            const file = document.querySelector('#file-upload').files[0];
            this.toBase64(file).then(file => {
                const data = {
                    email: $(`#sign-up-form [name="email"]`).val(),
                    password: $(`#sign-up-form [name="password"]`).val(),
                    first_name: $(`#sign-up-form [name="first_name"]`).val(),
                    last_name: $(`#sign-up-form [name="last_name"]`).val(),
                    age: $(`#sign-up-form [name="age"]`).val(),
                    profile_pic: file || ''
                };
                this.http.post('/user', data).then((data)=> {                    
                    this.draw();
                }).catch(() => {
                    alert('Failed');
                })
            })
        });
        $('#user-data-form').on('submit', (e) => {
            e.preventDefault();
            const file = document.querySelector('#file-upload-update').files[0];
            this.toBase64(file).then(file => {
                const data = {
                    email: $(`#user-data-form [name="email"]`).val(),
                    password: $(`#user-data-form [name="password"]`).val(),
                    first_name: $(`#user-data-form [name="first_name"]`).val(),
                    last_name: $(`#user-data-form [name="last_name"]`).val(),
                    age: $(`#user-data-form [name="age"]`).val(),
                    profile_pic: file || ''
                };
                this.http.put(`/user/${this.userId}`, data).then((data)=> {                    
                    this.getCurrentUserData();
                }).catch(() => {
                    alert('Failed');
                })
            })
        })
        $('#file-upload').on('change', () => {
            this.toBase64(document.querySelector('#file-upload').files[0]).then(src => {
                $(".profile-pic").attr('src' , src);
            })
        });
    },
    toBase64: file => new Promise((resolve, reject) => {
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        } else {
            resolve('');
        }
    }),
    getCurrentUserData() {
        this.http
            .get(`/user/${this.userId}`)
            .then((data) => {
                this.userData = data;
                this.isLoggedIn = true;
                this.draw();
            })
            .catch((message) => {
                this.userData = {};
                this.isLoggedIn = false;
                this.draw();
            });
    },
    draw() {
        if (this.isLoggedIn) {
            $("#log-in").hide();
            $("#sign-up").hide();
            $("#user-data").show();
            $('#user-data [name="email"]').val(this.userData.email);
            $('#user-data [name="first_name"]').val(this.userData.first_name);
            $('#user-data [name="last_name"]').val(this.userData.last_name);
            $('#user-data [name="age"]').val(this.userData.age);
            if (this.userData.photo_path) {
                $('#profile-pic-plhd').attr('src', API_HOST + '/' + this.userData.photo_path);
            }
        } else {
            $("#log-in").show();
            $("#user-data").hide();
        }
    },
};

APP.init();
