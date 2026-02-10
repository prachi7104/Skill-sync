
import { studentProfileSchema } from "../lib/validations/student-profile";

const testPayloads = [
    {
        name: "Empty Payload",
        data: {}
    },
    {
        name: "Partial Payload (strings empty)",
        data: {
            rollNo: "",
            sapId: "",
            branch: "",
            skills: []
        }
    },
    {
        name: "Payload with Nulls",
        data: {
            rollNo: null,
            sapId: null,
            cgpa: null,
            tenthPercentage: null
        }
    },
    {
        name: "Valid Payload",
        data: {
            rollNo: "R2142233333",
            sapId: "500126666",
            branch: "Computer Science",
            batchYear: 2025,
            cgpa: 9.5,
            semester: 6,
            tenthPercentage: 90.5,
            twelfthPercentage: 92.0,
            skills: []
        }
    }
];

testPayloads.forEach(test => {
    console.log(`\nTesting: ${test.name}`);
    const result = studentProfileSchema.safeParse(test.data);
    if (result.success) {
        console.log("✅ Success");
    } else {
        console.log("❌ Failed");
        console.log(JSON.stringify(result.error.format(), null, 2));
    }
});
