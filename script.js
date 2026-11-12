// =====================================================
// CLAIMFLOW - FINAL FRONTEND SCRIPT
// =====================================================

let token = localStorage.getItem("claimflow_token");
let current = null;

const API =
    "https://claimflow-api-2026-cfehbyftescvh3g5.koreacentral-01.azurewebsites.net/api";


// =====================================================
// HELPER: CONVERT ANY ERROR INTO READABLE TEXT
// =====================================================

function getErrorMessage(error, fallback = "Something went wrong.") {

    if (!error) {
        return fallback;
    }

    // Normal JavaScript Error
    if (typeof error.message === "string" && error.message.trim()) {
        return error.message;
    }

    // String error
    if (typeof error === "string") {
        return error;
    }

    // Object error
    if (typeof error === "object") {

        if (typeof error.detail === "string") {
            return error.detail;
        }

        if (typeof error.message === "string") {
            return error.message;
        }

        if (Array.isArray(error.detail)) {

            return error.detail
                .map(function (item) {

                    if (typeof item === "string") {
                        return item;
                    }

                    if (item && item.msg) {
                        return item.msg;
                    }

                    return JSON.stringify(item);

                })
                .join(", ");

        }

        try {
            return JSON.stringify(error);
        } catch (e) {
            return fallback;
        }
    }

    return fallback;
}


// =====================================================
// API REQUEST
// =====================================================

async function req(path, options = {}) {

    const headers = {
        ...(options.headers || {})
    };


    // Add JWT token when available

    if (token) {

        headers.Authorization =
            "Bearer " + token;

    }


    options.headers = headers;


    let response;


    // -----------------------------------------------
    // SEND REQUEST
    // -----------------------------------------------

    try {

        response =
            await fetch(API + path, options);

    } catch (error) {

        throw new Error(
            "Unable to connect to ClaimFlow server."
        );

    }


    // -----------------------------------------------
    // READ RESPONSE
    // -----------------------------------------------

    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        if (!response.ok) {

            throw new Error(
                "Server returned an invalid response."
            );

        }

        return {};

    }


    // -----------------------------------------------
    // HANDLE API ERROR
    // -----------------------------------------------

    if (!response.ok) {

        let message =
            "Request failed.";


        // detail = "Invalid email or password"

        if (
            typeof data.detail === "string"
        ) {

            message =
                data.detail;

        }


        // detail = validation error array

        else if (
            Array.isArray(data.detail)
        ) {

            message =
                data.detail
                    .map(function (item) {

                        if (
                            typeof item === "string"
                        ) {

                            return item;

                        }

                        if (
                            item &&
                            typeof item.msg === "string"
                        ) {

                            return item.msg;

                        }

                        if (
                            item &&
                            typeof item.message === "string"
                        ) {

                            return item.message;

                        }

                        return JSON.stringify(item);

                    })
                    .join(", ");

        }


        // detail = object

        else if (
            data.detail &&
            typeof data.detail === "object"
        ) {

            message =
                data.detail.message ||
                data.detail.msg ||
                JSON.stringify(data.detail);

        }


        // message = normal message

        else if (
            typeof data.message === "string"
        ) {

            message =
                data.message;

        }


        throw new Error(message);

    }


    return data;
}


// =====================================================
// LOGIN
// =====================================================

async function login() {

    const emailElement =
        document.getElementById("email");

    const passwordElement =
        document.getElementById("password");

    const messageElement =
        document.getElementById("loginMsg");


    if (!emailElement || !passwordElement) {

        return;

    }


    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;


    if (messageElement) {

        messageElement.textContent = "";

    }


    if (!email || !password) {

        if (messageElement) {

            messageElement.textContent =
                "Please enter email and password.";

        }

        return;

    }


    try {

        const data =
            await req(
                "/auth/login",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email: email,

                        password: password

                    })

                }
            );


        // Save JWT

        token =
            data.access_token;

        localStorage.setItem(
            "claimflow_token",
            token
        );


        // Save user

        current =
            data.user;


        // Open application

        await openApp();


    } catch (error) {

        if (messageElement) {

            messageElement.style.color =
                "red";

            messageElement.textContent =
                getErrorMessage(
                    error,
                    "Login failed."
                );

        }

    }
}


// =====================================================
// SHOW REGISTER FORM
// =====================================================

function showRegister() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    if (loginForm) {

        loginForm.classList.add(
            "hidden"
        );

    }


    if (registerForm) {

        registerForm.classList.remove(
            "hidden"
        );

    }


    const loginMsg =
        document.getElementById(
            "loginMsg"
        );

    const registerMsg =
        document.getElementById(
            "registerMsg"
        );


    if (loginMsg) {

        loginMsg.textContent = "";

    }


    if (registerMsg) {

        registerMsg.textContent = "";

    }

}


// =====================================================
// SHOW LOGIN FORM
// =====================================================

function showLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    if (registerForm) {

        registerForm.classList.add(
            "hidden"
        );

    }


    if (loginForm) {

        loginForm.classList.remove(
            "hidden"
        );

    }


    const loginMsg =
        document.getElementById(
            "loginMsg"
        );

    const registerMsg =
        document.getElementById(
            "registerMsg"
        );


    if (loginMsg) {

        loginMsg.textContent = "";

    }


    if (registerMsg) {

        registerMsg.textContent = "";

    }

}


// =====================================================
// REGISTER USER
// =====================================================

async function registerUser() {

    const nameElement =
        document.getElementById(
            "registerName"
        );

    const emailElement =
        document.getElementById(
            "registerEmail"
        );

    const passwordElement =
        document.getElementById(
            "registerPassword"
        );

    const messageElement =
        document.getElementById(
            "registerMsg"
        );


    if (
        !nameElement ||
        !emailElement ||
        !passwordElement
    ) {

        if (messageElement) {

            messageElement.textContent =
                "Registration form is not configured correctly.";

        }

        return;

    }


    const name =
        nameElement.value.trim();

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;


    if (messageElement) {

        messageElement.style.color =
            "";

        messageElement.textContent =
            "";

    }


    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name || !email || !password) {

        if (messageElement) {

            messageElement.textContent =
                "Please fill all fields.";

        }

        return;

    }


    if (password.length < 6) {

        if (messageElement) {

            messageElement.textContent =
                "Password must be at least 6 characters.";

        }

        return;

    }


    if (messageElement) {

        messageElement.textContent =
            "Creating account...";

    }


    // -----------------------------------------------
    // REGISTER API
    // -----------------------------------------------

    try {

        const data =
            await req(
                "/auth/register",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        email: email,

                        password: password

                    })

                }
            );


        // -------------------------------------------
        // SUCCESS
        // -------------------------------------------

        if (messageElement) {

            messageElement.style.color =
                "green";

            messageElement.textContent =
                data.message ||
                "Registration successful.";

        }


        // Clear registration fields

        nameElement.value = "";

        emailElement.value = "";

        passwordElement.value = "";


        // Go to login

        setTimeout(
            function () {

                showLogin();


                const loginEmail =
                    document.getElementById(
                        "email"
                    );


                if (loginEmail) {

                    loginEmail.value =
                        email;

                }

            },
            1000
        );


    } catch (error) {

        if (messageElement) {

            messageElement.style.color =
                "red";

            messageElement.textContent =
                getErrorMessage(
                    error,
                    "Registration failed."
                );

        }

    }
}


// =====================================================
// OPEN APPLICATION
// =====================================================

async function openApp() {

    const loginPage =
        document.getElementById(
            "login"
        );

    const app =
        document.getElementById(
            "app"
        );


    if (loginPage) {

        loginPage.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    try {

        const user =
            await req("/me");


        current =
            user;


        const userBox =
            document.getElementById(
                "userBox"
            );


        if (userBox) {

            userBox.textContent =
                `${user.name} • ${user.role}`;

        }


        await loadDashboard();

        await loadPolicies();

        await loadClaims();

        updateMenuByRole();


    } catch (error) {

        localStorage.removeItem(
            "claimflow_token"
        );

        token = null;

        current = null;

        location.reload();

    }
}


// =====================================================
// ROLE BASED MENU
// =====================================================

function updateMenuByRole() {

    const role =
        current?.role;


    const submitButton =
        document.querySelector(
            'aside button[onclick="show(\'submit\')"]'
        );


    const auditButton =
        document.querySelector(
            'aside button[onclick="show(\'audit\')"]'
        );


    // Policyholder and Admin can submit

    if (submitButton) {

        if (
            role === "Policyholder" ||
            role === "Admin"
        ) {

            submitButton.style.display =
                "block";

        } else {

            submitButton.style.display =
                "none";

        }

    }


    // Admin and Auditor can see audit logs

    if (auditButton) {

        if (
            role === "Admin" ||
            role === "Auditor"
        ) {

            auditButton.style.display =
                "block";

        } else {

            auditButton.style.display =
                "none";

        }

    }

}


// =====================================================
// NAVIGATION
// =====================================================

function show(id) {

    const sections = [
        "dashboard",
        "claims",
        "submit",
        "audit"
    ];


    sections.forEach(
        function (section) {

            const element =
                document.getElementById(
                    section
                );


            if (element) {

                element.classList.add(
                    "hidden"
                );

            }

        }
    );


    const target =
        document.getElementById(id);


    if (target) {

        target.classList.remove(
            "hidden"
        );

    }


    if (id === "dashboard") {

        loadDashboard();

    }


    if (id === "claims") {

        loadClaims();

    }


    if (id === "audit") {

        loadAudit();

    }

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const data =
            await req(
                "/dashboard"
            );


        const total =
            document.getElementById(
                "total"
            );

        const pending =
            document.getElementById(
                "pending"
            );

        const flagged =
            document.getElementById(
                "flagged"
            );

        const settled =
            document.getElementById(
                "settled"
            );


        if (total) {

            total.textContent =
                data.total_claims;

        }


        if (pending) {

            pending.textContent =
                data.pending_claims;

        }


        if (flagged) {

            flagged.textContent =
                data.flagged_claims;

        }


        if (settled) {

            settled.textContent =
                data.settled_claims;

        }


    } catch (error) {

        console.error(
            "Dashboard error:",
            getErrorMessage(error)
        );

    }

}


// =====================================================
// LOAD POLICIES
// =====================================================

async function loadPolicies() {

    try {

        const policies =
            await req(
                "/policies"
            );


        const policySelect =
            document.getElementById(
                "policy"
            );


        if (!policySelect) {

            return;

        }


        policySelect.innerHTML =
            policies
                .map(
                    function (policy) {

                        return `

                            <option value="${policy.id}">

                                ${policy.policy_number}
                                -
                                ${policy.customer_name}
                                (${policy.coverage_type})

                            </option>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Policy loading error:",
            getErrorMessage(error)
        );

    }

}


// =====================================================
// LOAD CLAIMS
// =====================================================

async function loadClaims() {

    try {

        const claims =
            await req(
                "/claims"
            );


        const rows =
            document.getElementById(
                "claimRows"
            );


        if (!rows) {

            return;

        }


        rows.innerHTML =
            claims
                .map(
                    function (claim) {

                        const riskClass =
                            claim.risk_flag === "Clear"
                                ? "clear"
                                : "risk";


                        const action =
                            getClaimAction(
                                claim
                            );


                        return `

                            <tr>

                                <td>
                                    ${claim.claim_number}
                                </td>

                                <td>
                                    ${claim.policy_number}
                                </td>

                                <td>
                                    ${claim.claim_type}
                                </td>

                                <td>
                                    ₹${Number(
                                        claim.amount
                                    ).toLocaleString()}
                                </td>

                                <td>

                                    <span
                                        class="badge ${riskClass}"
                                    >

                                        ${claim.risk_flag}

                                    </span>

                                </td>

                                <td>
                                    ${claim.status}
                                </td>

                                <td>
                                    ${action}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Claims loading error:",
            getErrorMessage(error)
        );

    }

}


// =====================================================
// CLAIM ACTIONS
// =====================================================

function getClaimAction(claim) {

    const role =
        current?.role;


    // -------------------------------------------------
    // ADMIN
    // -------------------------------------------------

    if (role === "Admin") {

        if (
            claim.status === "Approved"
        ) {

            return `

                <button
                    type="button"
                    onclick="settleClaim(${claim.id})">

                    Settle

                </button>

            `;

        }


        if (
            claim.status !== "Settled"
        ) {

            return `

                <select
                    onchange="changeStatus(
                        ${claim.id},
                        this.value
                    )">

                    <option value="${claim.status}">
                        ${claim.status}
                    </option>

                    <option value="Under Review">
                        Under Review
                    </option>

                    <option value="Approved">
                        Approved
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>

                </select>

            `;

        }


        return "-";

    }


    // -------------------------------------------------
    // CLAIMS OFFICER
    // -------------------------------------------------

    if (
        role === "Claims Officer"
    ) {

        if (
            claim.status === "Submitted" ||
            claim.status === "Under Review" ||
            claim.status === "Assessment Complete"
        ) {

            return `

                <select
                    onchange="changeStatus(
                        ${claim.id},
                        this.value
                    )">

                    <option value="${claim.status}">
                        ${claim.status}
                    </option>

                    <option value="Under Review">
                        Under Review
                    </option>

                    <option value="Approved">
                        Approved
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>

                </select>

            `;

        }


        return "-";

    }


    // -------------------------------------------------
    // SURVEYOR
    // -------------------------------------------------

    if (
        role === "Surveyor"
    ) {

        if (
            claim.status === "Submitted" ||
            claim.status === "Under Review"
        ) {

            return `

                <button
                    type="button"
                    onclick="submitAssessment(${claim.id})">

                    Assess

                </button>

            `;

        }


        return "-";

    }


    // -------------------------------------------------
    // FINANCE OFFICER
    // -------------------------------------------------

    if (
        role === "Finance Officer"
    ) {

        if (
            claim.status === "Approved"
        ) {

            return `

                <button
                    type="button"
                    onclick="settleClaim(${claim.id})">

                    Settle

                </button>

            `;

        }


        return "-";

    }


    // Policyholder

    return "-";

}


// =====================================================
// CHANGE CLAIM STATUS
// =====================================================

async function changeStatus(
    claimId,
    status
) {

    try {

        await req(
            `/claims/${claimId}/status`,
            {

                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    status: status

                })

            }
        );


        await loadClaims();

        await loadDashboard();


    } catch (error) {

        alert(
            getErrorMessage(
                error,
                "Unable to change claim status."
            )
        );


        await loadClaims();

    }

}


// =====================================================
// SUBMIT CLAIM
// =====================================================

async function submitClaim() {

    const policy =
        document.getElementById(
            "policy"
        );

    const type =
        document.getElementById(
            "type"
        );

    const date =
        document.getElementById(
            "date"
        );

    const description =
        document.getElementById(
            "desc"
        );

    const amount =
        document.getElementById(
            "amount"
        );

    const message =
        document.getElementById(
            "submitMsg"
        );


    if (
        !policy ||
        !type ||
        !date ||
        !description ||
        !amount
    ) {

        if (message) {

            message.textContent =
                "Claim form is not configured correctly.";

        }

        return;

    }


    try {

        const data =
            await req(
                "/claims",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        policy_id:
                            Number(
                                policy.value
                            ),

                        claim_type:
                            type.value,

                        incident_date:
                            date.value,

                        description:
                            description.value,

                        amount:
                            Number(
                                amount.value
                            )

                    })

                }
            );


        if (message) {

            message.textContent =
                `${data.message}. Risk: ${data.risk_flag}`;

        }


        await loadDashboard();

        await loadClaims();


    } catch (error) {

        if (message) {

            message.textContent =
                getErrorMessage(
                    error,
                    "Unable to submit claim."
                );

        }

    }

}


// =====================================================
// SURVEYOR ASSESSMENT
// =====================================================

async function submitAssessment(
    claimId
) {

    const surveyorName =
        prompt(
            "Enter Surveyor Name:"
        );


    if (!surveyorName) {

        return;

    }


    const damageLevel =
        prompt(
            "Damage Level (Low / Medium / High):"
        );


    if (!damageLevel) {

        return;

    }


    const assessedAmount =
        prompt(
            "Enter Assessed Amount:"
        );


    if (!assessedAmount) {

        return;

    }


    const remarks =
        prompt(
            "Enter Assessment Remarks:"
        );


    try {

        const result =
            await req(
                `/claims/${claimId}/assessment`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        surveyor_name:
                            surveyorName,

                        damage_level:
                            damageLevel,

                        assessed_amount:
                            Number(
                                assessedAmount
                            ),

                        remarks:
                            remarks || ""

                    })

                }
            );


        alert(
            result.message ||
            "Assessment completed."
        );


        await loadClaims();

        await loadDashboard();


    } catch (error) {

        alert(
            getErrorMessage(
                error,
                "Assessment failed."
            )
        );

    }

}


// =====================================================
// SETTLEMENT
// =====================================================

async function settleClaim(
    claimId
) {

    const approvedAmount =
        prompt(
            "Enter Approved Settlement Amount:"
        );


    if (!approvedAmount) {

        return;

    }


    if (
        Number(approvedAmount) <= 0
    ) {

        alert(
            "Settlement amount must be greater than 0."
        );

        return;

    }


    try {

        const result =
            await req(
                `/claims/${claimId}/settlement`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        approved_amount:
                            Number(
                                approvedAmount
                            )

                    })

                }
            );


        alert(
            result.message ||
            "Settlement completed."
        );


        await loadClaims();

        await loadDashboard();


    } catch (error) {

        alert(
            getErrorMessage(
                error,
                "Settlement failed."
            )
        );

    }

}


// =====================================================
// AUDIT LOGS
// =====================================================

async function loadAudit() {

    const rows =
        document.getElementById(
            "auditRows"
        );


    if (!rows) {

        return;

    }


    try {

        const logs =
            await req(
                "/audit-logs"
            );


        rows.innerHTML =
            logs
                .map(
                    function (log) {

                        return `

                            <tr>

                                <td>
                                    ${log.action}
                                </td>

                                <td>
                                    ${log.entity}
                                </td>

                                <td>
                                    ${log.entity_id || ""}
                                </td>

                                <td>
                                    ${log.details || ""}
                                </td>

                                <td>
                                    ${new Date(
                                        log.created_at
                                    ).toLocaleString()}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        rows.innerHTML = `

            <tr>

                <td colspan="5">

                    ${getErrorMessage(
                        error,
                        "Unable to load audit logs."
                    )}

                </td>

            </tr>

        `;

    }

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "claimflow_token"
    );

    token = null;

    current = null;

    location.reload();

}


// =====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.login =
    login;

window.showRegister =
    showRegister;

window.showLogin =
    showLogin;

window.registerUser =
    registerUser;

window.openApp =
    openApp;

window.show =
    show;

window.loadDashboard =
    loadDashboard;

window.loadPolicies =
    loadPolicies;

window.loadClaims =
    loadClaims;

window.changeStatus =
    changeStatus;

window.submitClaim =
    submitClaim;

window.submitAssessment =
    submitAssessment;

window.settleClaim =
    settleClaim;

window.loadAudit =
    loadAudit;

window.logout =
    logout;


// =====================================================
// AUTO LOGIN
// =====================================================

if (token) {

    openApp();

}
