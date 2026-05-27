import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Upload,
  Eye,
  Download,
  Lock,
  Save,
  Camera,
} from "lucide-react";
import { toast } from "react-toastify";

const Profile = () => {
  const wrapperStyle = {
    paddingBottom: "20px",
    marginTop: "20px",
  };

  const statCardsContainerStyle = {
    alignItems: "stretch",
  };

  const marginStyle = {
    marginBottom: "10px",
  };

  const buttonStyle = {
    width: "200px",
  };

  const { user, updateProfile } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const [deptName, setDeptName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const formatDateValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  const getDepartmentName = (dept) => {
    if (!dept) return "";
    // if it's a string that looks like an ObjectId, don't return the raw id
    if (typeof dept === "string") {
      if (/^[0-9a-fA-F]{24}$/.test(dept)) return "";
      return dept; // plain name
    }
    if (typeof dept === "object" && dept.name) return dept.name;
    return "";
  };
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    dateOfBirth: formatDateValue(user?.dateOfBirth),
    department: getDepartmentName(user?.department),
    position: user?.position || "",
    joinDate: formatDateValue(user?.joinDate || user?.startDate),
    experience: user?.experience || "",
    college: user?.college || "",
    bio: user?.bio || "",
    skills: user?.skills || "",
    emergencyContact: user?.emergencyContact || "",
    emergencyPhone: user?.emergencyPhone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Get resume from localStorage if it exists
  const [resumeFile, setResumeFile] = useState(() => {
    const savedResume = localStorage.getItem("userResume");
    return savedResume ? JSON.parse(savedResume) : null;
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resumeInputRef = useRef(null);

  // Validation helper
  const validateProfileData = () => {
    if (!profileData.name?.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (profileData.name.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return false;
    }
    if (!profileData.email?.trim()) {
      toast.error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (
      profileData.phone &&
      !/^[0-9\s\-\+\(\)]{10,}$/.test(profileData.phone.replace(/\s/g, ""))
    ) {
      toast.warning("Phone number format may be invalid");
    }
    if (
      profileData.dateOfBirth &&
      new Date(profileData.dateOfBirth) > new Date()
    ) {
      toast.error("Date of birth cannot be in the future");
      return false;
    }
    return true;
  };

  const handleProfileUpdate = async () => {
    if (!validateProfileData()) {
      return;
    }

    setIsSubmitting(true);
    try {
      toast.info("Updating profile...");
      await updateProfile(profileData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { changePassword } = useAuth();

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }
    if (!passwordData.confirmPassword) {
      toast.error("Please confirm your new password");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.warning("New password should be different from current password");
      return;
    }

    setIsSubmitting(true);
    try {
      toast.info("Changing password...");
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword,
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully!");
    } catch (err) {
      console.error("Password change failed:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change password";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.warning("No file selected");
      return;
    }

    // File type validation
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }

    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    toast.info("Uploading resume...");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Create a file info object to store
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          uploadDate: new Date().toISOString(),
          data: e.target.result, // Store file as base64
        };

        // Store file info in localStorage
        localStorage.setItem("userResume", JSON.stringify(fileInfo));

        setResumeFile(fileInfo);
        toast.success(`Resume "${file.name}" uploaded successfully!`);
      } catch (err) {
        console.error("Resume upload error:", err);
        toast.error("Failed to process resume");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleViewResume = () => {
    if (!resumeFile) {
      toast.error("No resume uploaded. Please upload a resume first.");
      return;
    }

    try {
      // Open the PDF in a new tab
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(`
          <iframe width="100%" height="100%" src="${resumeFile.data}" frameborder="0"></iframe>
        `);
        toast.success("Resume opened in new tab");
      } else {
        toast.error("Failed to open PDF. Please check your popup blocker.");
      }
    } catch (err) {
      console.error("View resume error:", err);
      toast.error("Failed to open resume");
    }
  };

  const handleDownloadResume = () => {
    if (!resumeFile) {
      toast.error("No resume uploaded. Please upload a resume first.");
      return;
    }

    try {
      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = resumeFile.data;
      downloadLink.download = resumeFile.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success(`Resume "${resumeFile.name}" downloaded successfully!`);
    } catch (err) {
      console.error("Download resume error:", err);
      toast.error("Failed to download resume");
    }
  };

  const { uploadProfileImage, user: currentUser } = useAuth();

  // Resolve department id -> name when `user.department` is an id
  useEffect(() => {
    let mounted = true;
    const dep = user?.department;
    if (!dep) return;
    // If already an object with name, use it
    if (typeof dep === "object" && dep.name) {
      setDeptName(dep.name);
      return;
    }
    // If it's a string that's not an ObjectId, assume it's already a name
    if (typeof dep === "string" && !/^[0-9a-fA-F]{24}$/.test(dep)) {
      setDeptName(dep);
      return;
    }
    if (typeof dep === "string") {
      (async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/departments/${dep}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!mounted) return;
          const name = res.data?.data?.name || "";
          setDeptName(name);
        } catch (err) {
          console.error("Failed to fetch department name", err);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setProfileData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      dateOfBirth: formatDateValue(user.dateOfBirth),
      department: getDepartmentName(user.department),
      position: user.position || "",
      joinDate: formatDateValue(user.joinDate || user.startDate),
      experience: user.experience || "",
      college: user.college || "",
      bio: user.bio || "",
      skills: user.skills || "",
      emergencyContact: user.emergencyContact || "",
      emergencyPhone: user.emergencyPhone || "",
    });
  }, [user]);

  // Keep profileData.department in sync with resolved deptName
  useEffect(() => {
    if (deptName) setProfileData((prev) => ({ ...prev, department: deptName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptName]);

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.warning("No file selected");
      return;
    }

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show a local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage(e.target.result);
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      toast.info("Uploading profile image...");
      const uploaded = await uploadProfileImage(
        file,
        currentUser?.id || currentUser?._id,
      );
      // If backend returned mapped user data with avatar, use that (persisted URL)
      if (uploaded && uploaded.avatar) {
        setProfileImage(uploaded.avatar);
        toast.success("Profile picture uploaded successfully!");
      } else {
        toast.success("Profile picture updated");
      }
    } catch (err) {
      console.error("Failed to upload profile image", err);
      const errorMsg =
        err?.response?.data?.message || "Failed to upload profile image";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div
          style={marginStyle}
          className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and settings
            </p>
          </div>
          <Button
            style={buttonStyle}
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={!isEditing ? "btn-gradient" : ""}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {/* Profile Overview */}
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative flex justify-center items-center">
                <Avatar>
                  <AvatarImage
                    src={profileImage || user?.avatar}
                    alt={user?.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <Label
                      htmlFor="profile-image-upload"
                      className="cursor-pointer"
                    >
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        asChild
                      >
                        <div>
                          <Camera className="w-4 h-4" />
                        </div>
                      </Button>
                    </Label>
                  </>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground">
                  {user?.position} •{" "}
                  {deptName || getDepartmentName(user?.department)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">
                    Employee ID: {user?.employeeId}
                  </Badge>
                  <Badge
                    variant={
                      user?.status === "active" ? "default" : "secondary"
                    }
                  >
                    {user?.status || "Active"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="flex flex-wrap w-full gap-2">
            <TabsTrigger value="personal" className="cursor-pointer">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="security" className="cursor-pointer">
              Security
            </TabsTrigger>
            <TabsTrigger value="documents" className="cursor-pointer">
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    rows={3}
                    className={
                      isEditing ? "resize-none" : "resize-none bg-muted"
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={profileData.joinDate}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      placeholder="Years of experience"
                      value={profileData.experience}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          experience: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college">College</Label>
                    <Input
                      id="college"
                      placeholder="College / University"
                      value={profileData.college}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          college: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <Separator />

                <div
                  style={marginStyle}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact name"
                      value={profileData.emergencyContact}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          emergencyContact: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      placeholder="Emergency contact phone"
                      value={profileData.emergencyPhone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          emergencyPhone: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4">
                    <Button
                      style={buttonStyle}
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={buttonStyle}
                      onClick={handleProfileUpdate}
                      className="btn-gradient"
                      disabled={isSubmitting}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  className="btn-gradient"
                  disabled={isSubmitting}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Changing Password..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Resume & Documents</CardTitle>
                <CardDescription>
                  Manage your resume and other important documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your latest resume (PDF format)
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                    ref={resumeInputRef}
                  />
                  <Button
                    className="btn-gradient"
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  {resumeFile && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: {resumeFile.name}
                    </p>
                  )}
                </div>

                {/* Current Documents */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Documents</h4>
                  <div className="space-y-3">
                    {resumeFile ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 font-semibold text-xs">
                              PDF
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{resumeFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded on{" "}
                              {new Date(
                                resumeFile.uploadDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleViewResume}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadResume}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No resume uploaded yet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
