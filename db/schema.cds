namespace my.db;
 
entity Entity1 {
    key psNumber     : String;
    PracticeBaseManager : String; // Added new field below psNumber
    ProjectID: String;
    KDM          : String;
    KDMSepDate : String;
    PeoplePartner: String;
    PeoplePartnerSepDate :String;
    IRM          : String;
    IRMSepDate :String;
}
 
entity Entity2 {
   //key psNumber     : String;
    PracticeBaseManager : String;
    KDM          : String;
    PeoplePartner: String;
    IRM        : String;
 
}