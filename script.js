let token = localStorage.getItem("claimflow_token");
let current = null;

const API = "https://claimflow-api-2026-cfehbyftescvh3g5.koreacentral-01.azurewebsites.net/api";


// ================= API REQUEST =================

async function req(path, opt = {}) {

    opt.headers = {
        ...(opt.headers || {}),
        ...(token ? {
            Authorization: "Bearer " + token
        } : {})
    };

    let r = await fetch(API + path, opt);

    let d = await r.json().catch(() => ({
        detail: "Server error"
    }));

    if (!r.ok) {
        throw Error(d.detail || "Request failed");
    }

    return d;
}


// ================= LOGIN =================

async function login() {

    try {

        let d = await req("/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            })

        });

        token = d.access_token;

        localStorage.setItem(
            "claimflow_token",
            token
        );

        current = d.user;

        openApp();

    } catch (e) {

        document.getElementById("loginMsg").textContent =
            e.message;

    }
}


// ================= REGISTRATION =================

function showRegister() {

    document.getElementById("loginForm")
        .classList.add("hidden");

    document.getElementById("registerForm")
        .classList.remove("hidden");

    document.getElementById("loginMsg").textContent = "";
}


function showLogin() {

    document.getElementById("registerForm")
        .classList.add("hidden");

    document.getElementById("loginForm")
        .classList.remove("hidden");

    document.getElementById("registerMsg").textContent = "";
}


async function registerUser() {

    const name =
        document.getElementById("registerName")
            .value.trim();

    const email =
        document.getElementById("registerEmail")
            .value.trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    const msg =
        document.getElementById("registerMsg");


    if (!name || !email || !password) {

        msg.textContent =
            "Please fill all fields.";

        return;
    }


    if (password.length < 6) {

        msg.textContent =
            "Password must be at least 6 characters.";

        return;
    }


    try {

        let d = await req(
            "/auth/register",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,
                    email: email,
                    password: password

                })

            }
        );


        msg.textContent =
            d.message + " You can now login.";


        document.getElementById(
            "registerName"
        ).value = "";

        document.getElementById(
            "registerEmail"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";


        setTimeout(() => {

            showLogin();

            document.getElementById(
                "email"
            ).value = email;

        }, 1000);


    } catch (e) {

        msg.textContent =
            e.message;

    }
}


// ================= OPEN APP =================

async function openApp() {

    document.getElementById("login")
        .classList.add("hidden");

    document.getElementById("app")
        .classList.remove("hidden");


    try {

        let u = await req("/me");

        current = u;


        document.getElementById(
            "userBox"
        ).textContent =
            `${u.name} • ${u.role}`;


        await loadDashboard();

        await loadPolicies();

        await loadClaims();

        updateMenuByRole();


    } catch (e) {

        localStorage.removeItem(
            "claimflow_token"
        );

        location.reload();

    }
}


// ================= ROLE BASED MENU =================

function updateMenuByRole() {

    const role = current?.role;


    const submitBtn =
        document.querySelector(
            'aside button[onclick="show(\'submit\')"]'
        );


    const auditBtn =
        document.querySelector(
            'aside button[onclick="show(\'audit\')"]'
        );


    // Policyholder can submit

    if (submitBtn) {

        if (
            role === "Policyholder" ||
            role === "Admin"
        ) {

            submitBtn.style.display =
                "block";

        } else {

            submitBtn.style.display =
                "none";

        }

    }


    // Only Admin and Auditor can view audit logs

    if (auditBtn) {

        if (
            role === "Admin" ||
            role === "Auditor"
        ) {

            auditBtn.style.display =
                "block";

        } else {

            auditBtn.style.display =
                "none";

        }

    }

}


// ================= NAVIGATION =================

function show(id) {

    [
        "dashboard",
        "claims",
        "submit",
        "audit"
    ].forEach(x => {

        let el =
            document.getElementById(x);

        if (el) {

            el.classList.add("hidden");

        }

    });


    let target =
        document.getElementById(id);


    if (target) {

        target.classList.remove("hidden");

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


// ================= DASHBOARD =================

async function loadDashboard() {

    try {

        let d =
            await req("/dashboard");


        document.getElementById(
            "total"
        ).textContent =
            d.total_claims;


        document.getElementById(
            "pending"
        ).textContent =
            d.pending_claims;


        document.getElementById(
            "flagged"
        ).textContent =
            d.flagged_claims;


        document.getElementById(
            "settled"
        ).textContent =
            d.settled_claims;


    } catch (e) {

        console.error(
            "Dashboard error:",
            e
        );

    }

}


// ================= POLICIES =================

async function loadPolicies() {

    try {

        let ps =
            await req("/policies");


        document.getElementById(
            "policy"
        ).innerHTML =

            ps.map(p => `

                <option value="${p.id}">

                    ${p.policy_number} -
                    ${p.customer_name}
                    (${p.coverage_type})

                </option>

            `).join("");


    } catch (e) {

        console.error(
            "Policy loading error:",
            e
        );

    }

}


// ================= CLAIMS =================

async function loadClaims() {

    try {

        let cs =
            await req("/claims");


        document.getElementById(
            "claimRows"
        ).innerHTML =

            cs.map(c => {

                let riskClass =
                    c.risk_flag === "Clear"
                        ? "clear"
                        : "risk";


                let action =
                    getClaimAction(c);


                return `

                    <tr>

                        <td>
                            ${c.claim_number}
                        </td>


                        <td>
                            ${c.policy_number}
                        </td>


                        <td>
                            ${c.claim_type}
                        </td>


                        <td>

                            ₹${Number(
                                c.amount
                            ).toLocaleString()}

                        </td>


                        <td>

                            <span class="badge ${riskClass}">

                                ${c.risk_flag}

                            </span>

                        </td>


                        <td>
                            ${c.status}
                        </td>


                        <td>
                            ${action}
                        </td>

                    </tr>

                `;

            }).join("");


    } catch (e) {

        console.error(
            "Claims loading error:",
            e
        );

    }

}


// ================= CLAIM ACTIONS =================

function getClaimAction(c) {

    const role =
        current?.role;


    // ================= ADMIN =================

    if (role === "Admin") {

        if (c.status === "Approved") {

            return `

                <button
                    onclick="settleClaim(${c.id})">

                    Settle

                </button>

            `;

        }


        if (c.status !== "Settled") {

            return `

                <select
                    onchange="changeStatus(
                        ${c.id},
                        this.value
                    )">

                    <option value="${c.status}">
                        ${c.status}
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


    // ================= CLAIMS OFFICER =================

    if (role === "Claims Officer") {

        if (
            c.status === "Submitted" ||
            c.status === "Under Review" ||
            c.status === "Assessment Complete"
        ) {

            return `

                <select
                    onchange="changeStatus(
                        ${c.id},
                        this.value
                    )">

                    <option value="${c.status}">
                        ${c.status}
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


    // ================= SURVEYOR =================

    if (role === "Surveyor") {

        if (
            c.status === "Under Review" ||
            c.status === "Submitted"
        ) {

            return `

                <button
                    onclick="submitAssessment(${c.id})">

                    Assess

                </button>

            `;

        }


        return "-";

    }


    // ================= FINANCE OFFICER =================

    if (role === "Finance Officer") {

        if (c.status === "Approved") {

            return `

                <button
                    onclick="settleClaim(${c.id})">

                    Settle

                </button>

            `;

        }


        return "-";

    }


    // ================= POLICYHOLDER =================

    return "-";

}


// ================= STATUS CHANGE =================

async function changeStatus(
    id,
    status
) {

    try {

        await req(
            `/claims/${id}/status`,
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


    } catch (e) {

        alert(e.message);

        await loadClaims();

    }

}


// ================= SUBMIT CLAIM =================

async function submitClaim() {

    try {

        let d =
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
                                document.getElementById(
                                    "policy"
                                ).value
                            ),


                        claim_type:
                            document.getElementById(
                                "type"
                            ).value,


                        incident_date:
                            document.getElementById(
                                "date"
                            ).value,


                        description:
                            document.getElementById(
                                "desc"
                            ).value,


                        amount:
                            Number(
                                document.getElementById(
                                    "amount"
                                ).value
                            )

                    })

                }
            );


        document.getElementById(
            "submitMsg"
        ).textContent =

            `${d.message}. Risk: ${d.risk_flag}`;


        await loadDashboard();

        await loadClaims();


    } catch (e) {

        document.getElementById(
            "submitMsg"
        ).textContent =

            e.message;

    }

}


// ================= SURVEYOR ASSESSMENT =================

async function submitAssessment(
    claimId
) {

    let surveyorName =
        prompt(
            "Enter Surveyor Name:"
        );


    if (!surveyorName) {

        return;

    }


    let damageLevel =
        prompt(
            "Damage Level (Low / Medium / High):"
        );


    if (!damageLevel) {

        return;

    }


    let assessedAmount =
        prompt(
            "Enter Assessed Amount:"
        );


    if (!assessedAmount) {

        return;

    }


    let remarks =
        prompt(
            "Enter Assessment Remarks:"
        );


    try {

        let result =
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
            result.message
        );


        await loadClaims();

        await loadDashboard();


    } catch (e) {

        alert(e.message);

    }

}


// ================= SETTLEMENT =================

async function settleClaim(
    claimId
) {

    let approvedAmount =
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

        let result =
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
            result.message
        );


        await loadClaims();

        await loadDashboard();


    } catch (e) {

        alert(e.message);

    }

}


// ================= AUDIT LOG =================

async function loadAudit() {

    try {

        let rows =
            await req(
                "/audit-logs"
            );


        document.getElementById(
            "auditRows"
        ).innerHTML =

            rows.map(x => `

                <tr>

                    <td>
                        ${x.action}
                    </td>


                    <td>
                        ${x.entity}
                    </td>


                    <td>
                        ${x.entity_id || ""}
                    </td>


                    <td>
                        ${x.details || ""}
                    </td>


                    <td>
                        ${new Date(
                            x.created_at
                        ).toLocaleString()}
                    </td>

                </tr>

            `).join("");


    } catch (e) {

        document.getElementById(
            "auditRows"
        ).innerHTML = `

            <tr>

                <td colspan="5">

                    ${e.message}

                </td>

            </tr>

        `;

    }

}


// ================= LOGOUT =================

function logout() {

    localStorage.removeItem(
        "claimflow_token"
    );

    token = null;

    current = null;

    location.reload();

}


// ================= AUTO LOGIN =================

if (token) {

    openApp();

}
