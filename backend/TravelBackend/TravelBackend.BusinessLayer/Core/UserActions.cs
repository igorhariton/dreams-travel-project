using TravelBackend.BusinessLayer.Structure;
using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.User;
using TravelBackend.Domain.Models.Responces;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.BusinessLayer.Core
{
    public class UserActions
    {
        public UserActions() { }

        internal bool UserLoginDataValidationExecution(UserLoginDto udata)
        {
            UserData? user;
            using (var db = new UserContext())
            {
                user = db.Users.FirstOrDefault(x =>
                    (x.UserName == udata.CredentialType || x.Email == udata.CredentialType) &&
                    x.Password == udata.Password);
            }

            if (user != null)
            {
                return true;
            }

            return false;
        }

        internal string UserTokenGeneration(UserLoginDto udata)
        {
            var token = new TokenService();

            var userToken = token.GenerateToken();

            return userToken;
        }

        internal ActionResponce UserRegDataValidationAction(UserRegisterDto uReg)
        {
            UserData? user;
            using (var db = new UserContext())
            {
                user = db.Users.FirstOrDefault(x =>
                    x.Email == uReg.Email || x.UserName == uReg.UserName);
            }

            if (user != null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "User already exists."
                };
            }

            user = new UserData
            {
                FirstName = uReg.FirstName,
                LastName = uReg.LastName,
                Email = uReg.Email,
                Password = uReg.Password,
                UserName = uReg.UserName,
                Phone = uReg.Phone,
                Role = UserRole.User,
                RegisteredOn = DateTime.Now
            };

            using (var db = new UserContext())
            {
                db.Users.Add(user);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "User registration successful."
            };
        }
    }
}
